'use strict';

var m = require('mithril');
var URI = require('URIjs');
var $ = require('jquery');

var Fangorn = require('js/fangorn');
var waterbutler = require('js/waterbutler');
var $osf = require('js/osfHelpers');

function changeState(grid, item, version) {
    item.data.version = version;
    grid.updateFolder(null, item);
}

function _downloadEvent(event, item, col) {
    event.stopPropagation();
    window.location = waterbutler.buildTreeBeardDownload(item, {path: item.data.extra.fileId});
}

// Define Fangorn Button Actions
function _dataverseDefineToolbar (item) {
    var tb = this;
    var buttons = [];

    function _uploadEvent (event, item, col){
        event.stopPropagation();
        tb.dropzone.hiddenFileInput.click();
        tb.dropzoneItemCache = item;
    }

    function dataversePublish(event, item, col) {
        var both = !item.data.dataverseIsPublished;
        var url = both ? item.data.urls.publishBoth : item.data.urls.publish;
        var toPublish = both ? 'Dataverse and dataset' : 'dataset';
        var modalContent = [
            m('h3', 'Publish this ' + toPublish + '?'),
            m('p.m-md', both ? 'This dataset cannot be published until ' + item.data.dataverse + ' Dataverse is published. ' : ''),
            m('p.m-md', 'By publishing this ' + toPublish + ', all content will be made available through the Harvard Dataverse using their internal privacy settings, regardless of your OSF project settings. '),
            m('p.font-thick.m-md', both ? 'Do you want to publish this Dataverse AND this dataset?' : 'Are you sure you want to publish this dataset?')
        ];
        var modalActions = [
            m('button.btn.btn-default.m-sm', { 'onclick' : function (){ tb.modal.dismiss(); }},'Cancel'),
            m('button.btn.btn-primary.m-sm', { 'onclick' : function() { publishDataset(); } }, 'Publish ' + toPublish)
        ];

        tb.modal.update(modalContent, modalActions);

        function publishDataset() {
            tb.modal.dismiss();
            item.notify.update('Publishing ' + toPublish, 'info', 1, 1);
            $.osf.putJSON(
                url,
                {}
            ).done(function(data) {
                item.notify.update();
                var modalContent = [
                    m('p.m-md', 'Your content has been published.')
                ];
                var modalActions = [
                    m('button.btn.btn-primary.m-sm', { 'onclick' : function() { tb.modal.dismiss(); } }, 'Okay')
                ];
                tb.modal.update(modalContent, modalActions);
                item.data.hasPublishedFiles = item.children.length > 0;
                item.data.version = item.data.hasPublishedFiles ? 'latest-published' : 'latest';
            }).fail(function(xhr, status, error) {
                var statusCode = xhr.responseJSON.code;
                var message;
                switch (statusCode) {
                    case 405:
                        message = 'Error: This dataset cannot be published until ' + item.data.dataverse + ' Dataverse is published.';
                        break;
                    case 409:
                        message = 'This dataset version has already been published.';
                        break;
                    default:
                        message = 'Error: Something went wrong when attempting to publish your dataset.';
                        Raven.captureMessage('Could not publish dataset', {
                            url: url,
                            textStatus: status,
                            error: error
                        });
                }

                var modalContent = [
                    m('p.m-md', message)
                ];
                var modalActions = [
                    m('button.btn.btn-primary.m-sm', { 'onclick' : function() { tb.modal.dismiss(); } }, 'Okay')
                ];
                tb.modal.update(modalContent, modalActions);
            });
        }
    }

    if (item.kind === 'folder' && item.data.addonFullname && item.data.version === 'latest' && item.data.permissions.edit) {
        buttons.push(
            { name : 'uploadFiles', template : function(){
                return m('.fangorn-toolbar-icon.text-success', {
                        onclick : function(event) { _uploadEvent.call(tb, event, item); }
                    },[
                    m('i.fa.fa-upload'),
                    m('span.hidden-xs','Upload')
                ]);
            }},
            { name : 'dataverseRelease', template : function(){
                return m('.fangorn-toolbar-icon.text-primary', {
                        onclick : function(event) { dataverseRelease.call(tb, event, item) }
                    },[
                    m('i.fa.fa-globe'),
                    m('span.hidden-xs','Release Study')
                ]);
            }}
        );
    } else if (item.kind === 'folder' && !item.data.addonFullname) {
        buttons.push(
            { name : 'uploadFiles', template : function(){
                return m('.fangorn-toolbar-icon.text-success', {
                        onclick : function(event) { _uploadEvent.call(tb, event, item); }
                    },[
                    m('i.fa.fa-upload'),
                    m('span.hidden-xs','Upload')
                ]);
            }},
            { name : 'uploadFiles', template : function(){
                return m('.fangorn-toolbar-icon.text-success', {
                        onclick : function(event) { dataversePublish.call(tb, event, item); }
                    },[
                    m('i.fa.fa-upload'),
                    m('span.hidden-xs','Publish')
                ]);
            }}
        );
    } else if (item.kind === 'file') {
        buttons.push(
            { name : 'downloadFile', template : function(){
                return m('.fangorn-toolbar-icon.text-info', {
                        onclick : function(event) { _downloadEvent.call(tb, event, item); }
                    },[
                    m('i.fa.fa-download'),
                    m('span.hidden-xs','Download')
                ]);
            }}
        );
        if (item.parent().data.state === 'draft' && item.data.permissions.edit) {
            buttons.push(
                { name : 'deleteFile', template : function(){
                    return m('.fangorn-toolbar-icon.text-danger', {
                            onclick : function(event) { Fangorn.ButtonEvents._removeEvent.call(tb, event, [item]); }
                        },[
                        m('i.fa.fa-times'),
                        m('span.hidden-xs','Delete')
                    ]);
                }}
                );
        }
    }
    item.icons = buttons;

    return true; // Tell fangorn this function is used.

}

function _fangornDataverseTitle(item, col) {
    var tb = this;
    if (item.data.addonFullname) {
        var contents = [m('dataverse-name', item.data.name + ' ')];
        if (item.data.hasPublishedFiles) {
            if (item.data.permissions.edit) {
                // Default to version in url parameters for file view page
                var urlParams = $osf.urlParams();
                if (urlParams.version && urlParams.version !== item.data.version) {
                    item.data.version = urlParams.version;
                }
                var options = [
                    m('option', {selected: item.data.version === 'latest-published', value: 'latest-published'}, 'Published'),
                    m('option', {selected: item.data.version === 'latest', value: 'latest'}, 'Draft')
                ];
                contents.push(
                    m('span', [
                        m('select', {
                            class: 'dataverse-state-select',
                            onchange: function(e) {
                                changeState(tb, item, e.target.value);
                            }
                        }, options)
                    ])
                );
            } else {
                contents.push(
                    m('span.text-muted', '[Published]')
                );
            }
        } else {
            contents.push(
                m('span.text.text-muted', '[Draft]')
            );
        }
        return m('span', contents);
    } else {
        return m('span',[
            m('dataverse-name', {
                ondblclick: function() {
                    var redir = new URI(item.data.nodeUrl);
                    window.location = redir
                        .segment('files')
                        .segment(item.data.provider)
                        .segment(item.data.extra.fileId)
                        .query({version: item.data.extra.datasetVersion})
                        .toString();
                },
                'data-toggle': 'tooltip',
                title: 'View file',
                'data-placement': 'bottom'
            }, item.data.name
             )
        ]);
    }
}

function _fangornColumns(item) {
    var tb = this;
    var selectClass = '';
    if (item.data.kind === 'file' && tb.currentFileID === item.id) {
        selectClass = 'fangorn-hover';
    }
    var columns = [];
    if (tb.options.placement === 'fileview') {
        columns.push({
            data : null,
            folderIcons: false,
            filter : false,
            custom : function(){
                if(this.isMultiselected(item.id)) {
                    return m('div.fangorn-select-toggle', { style : 'color: white'},m('i.fa.fa-check-square-o'));
                }
                return m('div.fangorn-select-toggle', m('i.fa.fa-square-o'));
            }
        });
    }

    columns.push({
        data : 'name',
        folderIcons : true,
        filter : true,
        css: selectClass,
        custom: _fangornDataverseTitle
    });

    if (tb.options.placement === 'project-files') {
        columns.push(
            {
                data: 'downloads',
                filter: false,
                css: ''
            }
        );
    }
    return columns;
}


function _fangornFolderIcons(item){
    if(item.data.iconUrl){
        return m('img',{src:item.data.iconUrl, style:{width:'16px', height:'auto'}}, ' ');
    }
    return undefined;
}

function _fangornDeleteUrl(item) {
    return waterbutler.buildTreeBeardDelete(item, {full_path: item.data.path + '?' + $.param({name: item.data.name})});
}

function _fangornLazyLoad(item) {
    return waterbutler.buildTreeBeardMetadata(item, {version: item.data.version});
}

function _canDrop(item) {
    return item.data.provider &&
        item.kind === 'folder' &&
        item.data.permissions.edit &&
//        item.data.state === 'draft'; Outdated with merge?
        item.data.version === 'latest';
}

Fangorn.config.dataverse = {
    folderIcon: _fangornFolderIcons,
    resolveDeleteUrl: _fangornDeleteUrl,
    resolveRows: _fangornColumns,
    lazyload:_fangornLazyLoad,
    canDrop: _canDrop,
    defineToolbar: _dataverseDefineToolbar,
};
