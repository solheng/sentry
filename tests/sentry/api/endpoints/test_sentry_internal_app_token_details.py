from __future__ import absolute_import

from django.core.urlresolvers import reverse

from sentry.testutils import APITestCase
from sentry.testutils.helpers import with_feature
from sentry.models import ApiToken


class SentryInternalAppTokenCreationTest(APITestCase):
    def setUp(self):
        self.user = self.create_user(email='boop@example.com')
        self.org = self.create_organization(owner=self.user, name='My Org')
        self.project = self.create_project(organization=self.org)

        self.internal_sentry_app = self.create_internal_integration(
            name='My Internal App',
            organization=self.org
        )

        self.api_token = ApiToken.objects.get(application=self.internal_sentry_app.application)

        self.url = reverse(
            'sentry-api-0-sentry-internal-app-token-details',
            args=[self.internal_sentry_app.slug, self.api_token.token],
        )

    @with_feature('organizations:sentry-apps')
    def test_delete_token(self):
        self.login_as(user=self.user)
        response = self.client.delete(self.url, format='json')
        assert response.status_code == 204
        assert not ApiToken.objects.filter(pk=self.api_token.id).exists()

    @with_feature('organizations:sentry-apps')
    def test_delete_invalid_token(self):
        self.login_as(user=self.user)

        url = reverse(
            'sentry-api-0-sentry-internal-app-token-details',
            args=[self.internal_sentry_app.slug, 'random'],
        )

        response = self.client.delete(url, format='json')
        assert response.status_code == 404

    @with_feature('organizations:sentry-apps')
    def test_delete_token_another_app(self):

        another_app = self.create_internal_integration(
            name='Another app',
            organization=self.org
        )
        api_token = ApiToken.objects.get(application=another_app.application)

        url = reverse(
            'sentry-api-0-sentry-internal-app-token-details',
            args=[self.internal_sentry_app.slug, api_token.token],
        )

        self.login_as(user=self.user)
        response = self.client.delete(url, format='json')
        assert response.status_code == 404

    @with_feature('organizations:sentry-apps')
    def test_non_internal_app(self):
        sentry_app = self.create_sentry_app(
            name='My External App',
            organization=self.org
        )

        url = reverse(
            'sentry-api-0-sentry-internal-app-token-details',
            args=[sentry_app.slug, self.api_token.token],
        )

        self.login_as(user=self.user)
        response = self.client.delete(url, format='json')

        assert response.status_code == 403
        assert response.data == 'This route is limited to internal integrations only'
