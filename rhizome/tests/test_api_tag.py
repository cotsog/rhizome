from tastypie.test import ResourceTestCase
from django.contrib.auth.models import User
from rhizome.models import IndicatorTag, LocationPermission, Location,\
    LocationType, Office

class IndicatorTagResourceTest(ResourceTestCase):
    def setUp(self):
        super(IndicatorTagResourceTest, self).setUp()

        # Create a user.
        self.username = 'john'
        self.password = 'pass'
        self.user = User.objects.create_user(self.username,
                                             'john@john.com', self.password)
        self.lt = LocationType.objects.create(name='test',admin_level = 0)
        self.o = Office.objects.create(name = 'Earth')

        self.top_lvl_location = Location.objects.create(
                name = 'Nigeria',
                location_code = 'Nigeria',
                location_type_id = self.lt.id,
                office_id = self.o.id,
            )

        LocationPermission.objects.create(user_id = self.user.id,\
            top_lvl_location_id = self.top_lvl_location.id)

        self.get_credentials()

        # create their api_key

    def get_credentials(self):
        result = self.api_client.client.login(username=self.username,
                                              password=self.password)
        return result

    def test_create_tag(self):
        post_data = {"tag_name": "test tag name", 'id': -1}

        IndicatorTag.objects.all().delete()
        self.assertEqual(IndicatorTag.objects.count(), 0)

        resp = self.api_client.post('/api/v1/indicator_tag/', format='json', \
                                    data=post_data, authentication=self.get_credentials())
        response_data = self.deserialize(resp)

        self.assertHttpCreated(resp)
        self.assertNotEqual(post_data['id'], response_data['id'])
        self.assertEqual(IndicatorTag.objects.count(), 1)
        self.assertNotEqual(IndicatorTag.objects.all()[0].id, -1)

    def test_update_tag(self):

        IndicatorTag.objects.all().delete()

        tag = IndicatorTag.objects.create(id=None, \
                                    tag_name='Test Tag Name', )

        self.assertEqual(IndicatorTag.objects.count(), 1)
        new_tag_name = "New Tag Name"
        post_data = {"id": tag.id, "tag_name": new_tag_name }
        resp = self.api_client.post('/api/v1/indicator_tag/', format='json', \
                                    data=post_data, authentication=self.get_credentials())

        response_data = self.deserialize(resp)

        self.assertHttpCreated(resp)
        self.assertEqual(tag.id, response_data['id'])
        self.assertEqual(IndicatorTag.objects.count(), 1)
        self.assertEqual(new_tag_name, response_data['tag_name'])
