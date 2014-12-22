from django.db import models
from autoslug import AutoSlugField
from simple_history.models import HistoricalRecords


class Source(models.Model):
    source_name = models.CharField(max_length=55,unique=True)
    source_description = models.CharField(max_length=255,unique=True)

    def __unicode__(self):
        return unicode(self.source_name)

    class Meta:
        db_table = 'source'

class Indicator(models.Model):

    short_name = models.CharField(max_length=55,unique=False) # FIX UNIQUE HERE!
    name = models.CharField(max_length=255,unique=True)
    description = models.CharField(max_length=255)
    is_reported = models.BooleanField(default=True)
    slug = AutoSlugField(populate_from='name',unique=True,max_length=255)
    created_at = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return unicode(self.name)

    class Meta:
        db_table = 'indicator'
        ordering = ('name',)

class CalculatedIndicatorComponent(models.Model):

    indicator = models.ForeignKey(Indicator, related_name='indicator_master')
    indicator_component = models.ForeignKey(Indicator,related_name='indicator_component')
    calculation = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now=True)


    def __unicode__(self):
        return unicode(self.indicator.name)

    class Meta:
        db_table = 'calculated_indicator_component'



class Office(models.Model):

    name = models.CharField(max_length=55)
    created_at = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return unicode(self.name)

    class Meta:
        db_table = 'office'

        permissions = (
            ('view_office', 'View office'),
        )

class RegionType(models.Model):

    name = models.CharField(max_length=55, unique=True)

    class Meta:
        db_table = 'region_type'

class Region(models.Model):

    name = models.CharField(max_length=55,unique=True)
    region_code = models.CharField(max_length=55, unique=True)
    region_type = models.ForeignKey(RegionType)
    office = models.ForeignKey(Office)
    shape_file_path  = models.CharField(max_length=255,null=True,blank=True)
    latitude = models.FloatField(null=True,blank=True)
    longitude = models.FloatField(null=True,blank=True)
    slug = AutoSlugField(populate_from='name',max_length=55)
    created_at = models.DateTimeField(auto_now=True)
    source = models.ForeignKey(Source)
    source_region = models.ForeignKey('source_data.SourceRegion')
    is_high_risk = models.BooleanField(default=False)
    parent_region = models.ForeignKey("self",null=True)

    def __unicode__(self):
        return unicode(self.name)

    def get_all_children(self):

        r = []

        for c in Region.objects.filter(parent_region=self):
            # r.append(c.get_all_children())
            r.append(c)

        second_leaf = Region.objects.filter(parent_region__in=r)

        r.extend(second_leaf)

        return r


    class Meta:
        db_table = 'region'
        unique_together = ('name','region_type','office')

        permissions = (
            ('view_region', 'View region'),
        )

        ordering = ('name',)

class CampaignType(models.Model):

    name = models.CharField(max_length=55)

class Campaign(models.Model):

    office = models.ForeignKey(Office)
    campaign_type = models.ForeignKey(CampaignType)
    start_date = models.DateField()
    end_date = models.DateField()
    slug = AutoSlugField(populate_from='get_full_name')
    created_at = models.DateTimeField(auto_now=True)


    def __unicode__(self):
        return unicode(self.office + '-' + self.start_date)


    def get_full_name(self):
        full_name = self.office.name + '-' + self.__unicode__()
        return full_name

    class Meta:
        db_table = 'campaign'
        ordering = ('-start_date',)
        unique_together = ('office','start_date')

class DataPoint(models.Model):

    indicator = models.ForeignKey(Indicator)
    region = models.ForeignKey(Region)
    campaign = models.ForeignKey(Campaign)
    value = models.FloatField()
    note = models.CharField(max_length=255,null=True,blank=True)
    changed_by = models.ForeignKey('auth.User')
    created_at = models.DateTimeField(auto_now=True)
    source_datapoint = models.ForeignKey('source_data.SourceDataPoint')

    # history = HistoricalRecords()

    def get_val(self):

        return self.value


    class Meta:
        db_table = 'datapoint'
        unique_together = ('indicator','region','campaign')
        ordering = ['region', 'campaign']


        permissions = (
            ('view_datapoint', 'View datapoint'),
        )

class Responsibility(models.Model):

    user = models.ForeignKey('auth.User')
    indicator = models.ForeignKey(Indicator)
    region = models.ForeignKey(Region)

    class Meta:
        db_table = 'responsibility'
        ordering = ('indicator',)
        unique_together = ('user','indicator','region')


class ParentRegionAgg(models.Model):

    parent_region = models.ForeignKey(Region)
    indicator = models.ForeignKey(Indicator)
    campaign = models.ForeignKey(Campaign)
    the_sum = models.FloatField()

    class Meta:
        db_table = 'parent_region_agg'
        managed = False
