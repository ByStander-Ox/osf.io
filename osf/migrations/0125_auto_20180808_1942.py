# -*- coding: utf-8 -*-
# Generated by Django 1.11.13 on 2018-08-08 19:42
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        ('osf', '0124_merge_20180803_1425'),
    ]

    operations = [
        migrations.CreateModel(
            name='AbstractProviderGroupObjectPermission',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_object', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='osf.AbstractProvider')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.Group')),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.Permission')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='AbstractProviderUserObjectPermission',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_object', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='osf.AbstractProvider')),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.Permission')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AlterModelOptions(
            name='abstractprovider',
            options={'permissions': (('set_up_moderation', 'Can set up moderation for this provider'), ('view_submissions', 'Can view all submissions to this provider'), ('accept_submissions', 'Can accept submissions to this provider'), ('reject_submissions', 'Can reject submissions to this provider'), ('withdraw_submissions', 'Can withdraw submissions from this provider'), ('edit_review_comments', 'Can edit comments on actions for this provider'), ('view_actions', 'Can view actions on submissions to this provider'), ('add_moderator', 'Can add other users as moderators for this provider'), ('update_moderator', 'Can elevate or lower other moderators/admins'), ('remove_moderator', 'Can remove moderators from this provider. Implicitly granted to self'), ('edit_reviews_settings', 'Can edit reviews settings for this provider'), ('add_reviewer', 'Can add other users as reviewers for this provider'), ('assign_reviewer', 'Can assign reviewers to review specific submissions to this provider'), ('view_assigned_submissions', 'Can view submissions to this provider which have been assigned to this user'), ('review_assigned_submissions', 'Can submit reviews for submissions to this provider which have been assigned to this user'))},
        ),
        migrations.AlterModelOptions(
            name='collectionprovider',
            options={'permissions': (('view_collectionprovider', 'Can view collection provider details'),)},
        ),
        migrations.AlterModelOptions(
            name='preprintprovider',
            options={'permissions': (('view_preprintprovider', 'Can view preprint provider details'),)},
        ),
        migrations.AlterModelOptions(
            name='registrationprovider',
            options={'permissions': (('view_registrationprovider', 'Can view registration provider details'),)},
        ),
        migrations.AlterUniqueTogether(
            name='abstractprovideruserobjectpermission',
            unique_together=set([('user', 'permission', 'content_object')]),
        ),
        migrations.AlterUniqueTogether(
            name='abstractprovidergroupobjectpermission',
            unique_together=set([('group', 'permission', 'content_object')]),
        ),
    ]
