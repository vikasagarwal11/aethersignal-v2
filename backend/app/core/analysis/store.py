from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .models import AnalysisHandle, SignalQueryFilters, SavedAnalysis


class AnalysisStore:
    """
    MVP in-memory store for analyses created from chat responses.

    Phase 1:
        - In-memory dict
        - TTL cleanup
        - Limit per session
    """

    def __init__(self, ttl_minutes: int = 60, max_per_session: int = 16) -> None:
        self._by_id: Dict[str, AnalysisHandle] = {}
        self._expiry: Dict[str, datetime] = {}
        self._ids_by_session: Dict[str, List[str]] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
        self.max_per_session = max_per_session

    def save(self, handle: AnalysisHandle) -> AnalysisHandle:
        now = datetime.utcnow()
        self._by_id[handle.id] = handle
        self._expiry[handle.id] = now + self.ttl

        if handle.session_id:
            ids = self._ids_by_session.setdefault(handle.session_id, [])
            ids.append(handle.id)
            # enforce max_per_session
            if len(ids) > self.max_per_session:
                # drop oldest
                to_drop = ids[:-self.max_per_session]
                for hid in to_drop:
                    self.delete(hid)
                self._ids_by_session[handle.session_id] = ids[-self.max_per_session :]

        self.cleanup()
        return handle

    def get(self, analysis_id: str) -> Optional[AnalysisHandle]:
        self.cleanup()
        return self._by_id.get(analysis_id)

    def list_for_session(self, session_id: str) -> List[AnalysisHandle]:
        """Return all analyses for a given session."""
        self.cleanup()
        ids = self._ids_by_session.get(session_id, [])
        return [self._by_id[aid] for aid in ids if aid in self._by_id]

    def delete(self, analysis_id: str) -> None:
        self._by_id.pop(analysis_id, None)
        self._expiry.pop(analysis_id, None)
        # also remove from per-session index
        for sid, ids in list(self._ids_by_session.items()):
            if analysis_id in ids:
                self._ids_by_session[sid] = [i for i in ids if i != analysis_id]
                if not self._ids_by_session[sid]:
                    self._ids_by_session.pop(sid, None)

    def cleanup(self) -> None:
        now = datetime.utcnow()
        expired = [aid for aid, exp in self._expiry.items() if exp < now]
        for aid in expired:
            self.delete(aid)


class SavedAnalysisStore:
    """
    MVP in-memory store for saved/bookmarked analyses.

    For now we key everything by session_id; later this will be user_id-based
    and backed by Postgres.
    """

    def __init__(self, max_per_session: int = 32) -> None:
        self._by_id: Dict[str, SavedAnalysis] = {}
        self._ids_by_session: Dict[str, List[str]] = {}
        self.max_per_session = max_per_session

    def save(self, saved: SavedAnalysis) -> SavedAnalysis:
        self._by_id[saved.id] = saved
        if saved.session_id:
            ids = self._ids_by_session.setdefault(saved.session_id, [])
            ids.append(saved.id)
            # enforce cap
            if len(ids) > self.max_per_session:
                to_drop = ids[:-self.max_per_session]
                for sid in to_drop:
                    self._by_id.pop(sid, None)
                self._ids_by_session[saved.session_id] = ids[-self.max_per_session :]
        return saved

    def list_for_session(self, session_id: str) -> List[SavedAnalysis]:
        ids = self._ids_by_session.get(session_id, [])
        return [self._by_id[aid] for aid in ids if aid in self._by_id]

    def get(self, saved_id: str) -> Optional[SavedAnalysis]:
        return self._by_id.get(saved_id)

    def delete(self, saved_id: str) -> None:
        saved = self._by_id.pop(saved_id, None)
        if not saved or not saved.session_id:
            return
        ids = self._ids_by_session.get(saved.session_id, [])
        self._ids_by_session[saved.session_id] = [i for i in ids if i != saved_id]
        if not self._ids_by_session[saved.session_id]:
            self._ids_by_session.pop(saved.session_id, None)


class SessionStore:
    """
    Tracks the current filters per chat session, so we can do refinement:
        - First query: "serious cases" → filters A
        - Next: "with bleeding" (refinement_mode=True) → merge filters A + B
    """

    def __init__(self) -> None:
        self._filters_by_session: Dict[str, SignalQueryFilters] = {}

    def get_filters(self, session_id: str) -> Optional[SignalQueryFilters]:
        return self._filters_by_session.get(session_id)

    def save_filters(self, session_id: str, filters: SignalQueryFilters) -> None:
        self._filters_by_session[session_id] = filters

    def clear(self, session_id: str) -> None:
        self._filters_by_session.pop(session_id, None)
