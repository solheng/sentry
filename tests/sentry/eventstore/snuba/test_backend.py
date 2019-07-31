from __future__ import absolute_import

from datetime import timedelta
from django.utils import timezone

from sentry.testutils import TestCase, SnubaTestCase
from sentry.eventstore.snuba.backend import SnubaEventStorage


class SnubaEventStorageTest(TestCase, SnubaTestCase):
    def setUp(self):
        super(SnubaEventStorageTest, self).setUp()
        min_ago = (timezone.now() - timedelta(minutes=1)).isoformat()[:19]
        five_min_ago = (timezone.now() - timedelta(minutes=5)).isoformat()[:19]

        self.event1 = self.store_event(
            data={
                'event_id': 'a' * 32,
                'type': 'default',
                'platform': 'python',
                'fingerprint': ['group1'],
                'timestamp': five_min_ago,
            },
            project_id=self.project.id,
        )
        self.event2 = self.store_event(
            data={
                'event_id': 'b' * 32,
                'type': 'default',
                'platform': 'python',
                'fingerprint': ['group1'],
                'timestamp': min_ago,
            },
            project_id=self.project.id,
        )

        self.eventstore = SnubaEventStorage()

    def test_get_events(self):
        events = self.eventstore.get_events(filter_keys={'project_id': [self.project.id]})
        assert len(events) == 2
        # Default sort is timestamp desc
        assert events[0].id == 'b' * 32
        assert events[1].id == 'a' * 32

        # No events found
        project = self.create_project()
        events = self.eventstore.get_events(filter_keys={'project_id': [project.id]})
        assert events == []
