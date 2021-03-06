from django.contrib.auth.models import User

from rhizome.api.resources.base_model import BaseModelResource

class UserResource(BaseModelResource):
    class Meta(BaseModelResource.Meta):
        queryset = User.objects.all().values()
        resource_name = 'user'

