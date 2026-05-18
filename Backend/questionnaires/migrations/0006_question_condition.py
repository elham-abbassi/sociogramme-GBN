from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('questionnaires', '0005_choiceoption_is_permanent'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='condition_question',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='dependent_questions',
                to='questionnaires.question',
            ),
        ),
        migrations.AddField(
            model_name='question',
            name='condition_value',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
