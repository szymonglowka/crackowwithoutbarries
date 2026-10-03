from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("places", "0002_report")]

    operations = [UnaccentExtension()]
