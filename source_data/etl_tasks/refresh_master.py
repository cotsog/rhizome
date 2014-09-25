import pprint as pp

from django.db import IntegrityError
from django.core.exceptions import ValidationError

from datapoints.models import DataPoint


class MasterRefresh(object):


      def __init__(self,mappings,records,user_id):

          self.mappings = mappings
          self.records = records
          self.user_id = user_id

          self.main()

      def main(self):

          for record in self.records:
              err, datapoint_id = self.process_source_datapoint_record(record)
              if err:
                  print err


      def process_source_datapoint_record(self,record):

          try:
              # indicator_string = record.indicator_string
              indicator_id = self.mappings['indicators'][record.indicator_string]
          except KeyError as err:
              return err, None

          try:
              region_id = self.mappings['regions'][record.region_string]
          except KeyError as err:
              return err, None

          try:
              campaign_id = self.mappings['campaigns'][record.campaign_string]
          except KeyError as err:
              return err, None


          try:
              datapoint, created = DataPoint.objects.get_or_create(
                  indicator_id = indicator_id,
                  region_id = region_id,
                  campaign_id = campaign_id,
                  value = record.cell_value,
                  changed_by_id = self.user_id,
                  source_datapoint_id = record.id
              )

          ## STORE THE ERROR MESSAGE SOMEWHERE FOR USER TO REVIEW ##
          except IntegrityError as err:
              return err, None
          except ValidationError:
              return err, None
              # NEEDS TO BE HANDLED BY GENERIC VALIDATION MODULE


          return None, datapoint_id
