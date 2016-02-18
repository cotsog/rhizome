import json

from django.http import HttpResponse

from tastypie.resources import ALL
from tastypie.bundle import Bundle
from tastypie.exceptions import ImmediateHttpResponse

from datapoints.api.resources.base_model import BaseModelResource
from datapoints.models import Indicator

class IndicatorResource(BaseModelResource):

    class Meta(BaseModelResource.Meta):
        resource_name = 'indicator'
        filtering = {
            "id": ALL,
        }

    def get_object_list(self, request):

        indicator_id_list = []

        try:
            indicator_id = int(request.GET['id'])
            indicator_id_list.append(indicator_id)
        except KeyError:
            pass

        try:
            indicator_id_list = [int(x) for x in request.GET['id__in'].split(',')]
        except KeyError:
            pass

        if len(indicator_id_list) == 0:
            return Indicator.objects.all().values()

        else:
            return Indicator.objects.filter(id__in=indicator_id_list).values()


    def detail_uri_kwargs(self, bundle_or_obj):
        kwargs = {}

        if isinstance(bundle_or_obj, Bundle):
            kwargs['pk'] = bundle_or_obj.obj.id
        else:
            kwargs['pk'] = bundle_or_obj.id

        return kwargs

    def obj_create(self, bundle, **kwargs):

        post_data = bundle.data

        try:
            ind_id = int(post_data['id'])
            if ind_id == -1:
                ind_id = None
        except KeyError:
            ind_id = None

        try:
            defaults = {
                'name': post_data['name'],
                'short_name': post_data['short_name'],
                'description': post_data['description'],
                'data_format': post_data['data_format'],
                'high_bound': post_data['high_bound'],
                'low_bound': post_data['low_bound'],
                'source_name': post_data['source_name']
            }
        except Exception as error:
            data = {
                'error': 'Please provide ' + str(error) + ' for the indicator.',
                'code': -1
            }
            raise ImmediateHttpResponse(response=HttpResponse(json.dumps(data),
                                        status=500,
                                        content_type='application/json'))

        try:
            ind, created = Indicator.objects.update_or_create(
                id=ind_id,
                defaults=defaults
            )
        except Exception as error:
            data = {
                'error': error.message,
                'code': -1
            }
            raise ImmediateHttpResponse(response=HttpResponse(json.dumps(data),
                                        status=422,
                                        content_type='application/json'))

        bundle.obj = ind
        bundle.data['id'] = ind.id

        return bundle