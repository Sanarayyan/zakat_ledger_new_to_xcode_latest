from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_accountdeletionreceipt'),
    ]

    operations = [
        migrations.AddField(
            model_name='accountdeletionreceipt',
            name='account_hash',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
    ]
