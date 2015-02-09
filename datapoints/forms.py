from django.forms import ModelForm, forms, ModelChoiceField
from datapoints.models import *
from django.contrib.auth.models import User

class RegionForm(ModelForm):

    class Meta:
        model = Region
        # fields = ['name', 'source', 'source_region']
        exclude = ['source','source_region']

class IndicatorForm(ModelForm):

    class Meta:
        model = Indicator

class DataPointForm(ModelForm):

    class Meta:
        model = DataPoint
        fields = ['indicator','region', 'campaign', 'value']

class CampaignForm(ModelForm):

    class Meta:
        model = Campaign

class DataPointSearchForm(forms.Form):
    region = ModelChoiceField(queryset=Region.objects.all())
    indicator = ModelChoiceField(queryset=Indicator.objects.all())
    campaign = ModelChoiceField(queryset=Campaign.objects.all())
    changed_by = ModelChoiceField(queryset=User.objects.all())
