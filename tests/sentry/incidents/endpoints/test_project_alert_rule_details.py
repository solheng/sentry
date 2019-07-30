from __future__ import absolute_import

from exam import fixture

from sentry.api.serializers import serialize
from sentry.incidents.logic import create_alert_rule
from sentry.incidents.models import (
    AlertRule,
    AlertRuleAggregations,
    AlertRuleThresholdType,
)
from sentry.testutils import APITestCase


class AlertRuleDetailsGetEndpointTest(APITestCase):
    endpoint = 'sentry-api-0-project-alert-rule-details'

    @fixture
    def organization(self):
        return self.create_organization()

    @fixture
    def project(self):
        return self.create_project(organization=self.organization)

    @fixture
    def user(self):
        return self.create_user()

    @fixture
    def alert_rule(self):
        return create_alert_rule(
            self.project,
            'hello',
            AlertRuleThresholdType.ABOVE,
            'level:error',
            [AlertRuleAggregations.TOTAL],
            10,
            1000,
            400,
            1,
        )

    def test_invalid_rule_id(self):
        self.create_team(organization=self.organization, members=[self.user])
        self.login_as(self.user)
        with self.feature('organizations:incidents'):
            resp = self.get_response(
                self.organization.slug,
                self.project.slug,
                1234,
            )

        assert resp.status_code == 404

    def test_simple(self):
        self.create_team(organization=self.organization, members=[self.user])
        self.login_as(self.user)
        with self.feature('organizations:incidents'):
            resp = self.get_valid_response(
                self.organization.slug,
                self.project.slug,
                self.alert_rule.id,
            )

        assert resp.data == serialize(self.alert_rule)

    def test_permissions(self):
        self.create_team(organization=self.organization, members=[self.user])
        self.login_as(self.create_user())
        with self.feature('organizations:incidents'):
            resp = self.get_response(
                self.organization.slug,
                self.project.slug,
                self.alert_rule.id,
            )

        assert resp.status_code == 403

    def test_no_feature(self):
        self.create_team(organization=self.organization, members=[self.user])
        self.login_as(self.user)
        resp = self.get_response(
            self.organization.slug,
            self.project.slug,
            self.alert_rule.id,
        )
        assert resp.status_code == 404


class AlertRuleDetailsPutEndpointTest(APITestCase):
    method = 'put'
    endpoint = 'sentry-api-0-project-alert-rule-details'

    @fixture
    def organization(self):
        return self.create_organization()

    @fixture
    def project(self):
        return self.create_project(organization=self.organization)

    @fixture
    def user(self):
        return self.create_user()

    @fixture
    def alert_rule(self):
        return create_alert_rule(
            self.project,
            'hello',
            AlertRuleThresholdType.ABOVE,
            'level:error',
            [AlertRuleAggregations.TOTAL],
            10,
            1000,
            400,
            1,
        )

    def test_invalid_rule_id(self):
        self.create_member(
            user=self.user,
            organization=self.organization,
            role='owner',
            teams=[self.team],
        )
        self.login_as(self.user)
        with self.feature('organizations:incidents'):
            resp = self.get_response(
                self.organization.slug,
                self.project.slug,
                1234,
            )

        assert resp.status_code == 404

    def test_simple(self):
        self.create_member(
            user=self.user,
            organization=self.organization,
            role='owner',
            teams=[self.team],
        )

        self.login_as(self.user)
        with self.feature('organizations:incidents'):
            resp = self.get_valid_response(
                self.organization.slug,
                self.project.slug,
                self.alert_rule.id,
                name='what',
            )

        alert_rule = AlertRule.objects.get(id=self.alert_rule.id)

        assert resp.data == serialize(alert_rule)
        assert resp.data['name'] == 'what'

    def test_permissions(self):
        self.create_team(organization=self.organization, members=[self.user])
        self.login_as(self.create_user())
        with self.feature('organizations:incidents'):
            resp = self.get_response(
                self.organization.slug,
                self.project.slug,
                self.alert_rule.id,
                name='what',
            )

        assert resp.status_code == 403

    def test_no_feature(self):
        self.create_member(
            user=self.user,
            organization=self.organization,
            role='owner',
            teams=[self.team],
        )
        self.login_as(self.user)
        resp = self.get_response(
            self.organization.slug,
            self.project.slug,
            self.alert_rule.id,
            name='what',
        )
        assert resp.status_code == 404
