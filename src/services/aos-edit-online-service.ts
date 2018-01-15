import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Rx';
import {
  AlfrescoApiService,
  AlfrescoAuthenticationService,
  NotificationService,
  AppConfigService,
  AlfrescoContentService,
  AlfrescoTranslationService
} from 'ng2-alfresco-core';
import { DocumentActionsService } from 'ng2-alfresco-documentlist';
import { MinimalNodeEntity } from 'alfresco-js-api';

@Injectable()
export class AOSEditOnlineService {

  static ECM_HOST_CONFIG_KEY = 'ecmHost';
  static AOS_EDITONLINE_ACTION_HANDLER_KEY: string = 'aos-editonline';
  static MS_PROTOCOL_NAMES: any = {
    'doc': 'ms-word',
    'docx': 'ms-word',
    'docm': 'ms-word',
    'dot': 'ms-word',
    'dotx': 'ms-word',
    'dotm': 'ms-word',
    'xls': 'ms-excel',
    'xlsx': 'ms-excel',
    'xlsb': 'ms-excel',
    'xlsm': 'ms-excel',
    'xlt': 'ms-excel',
    'xltx': 'ms-excel',
    'xltm': 'ms-excel',
    'ppt': 'ms-powerpoint',
    'pptx': 'ms-powerpoint',
    'pot': 'ms-powerpoint',
    'potx': 'ms-powerpoint',
    'potm': 'ms-powerpoint',
    'pptm': 'ms-powerpoint',
    'pps': 'ms-powerpoint',
    'ppsx': 'ms-powerpoint',
    'ppam': 'ms-powerpoint',
    'ppsm': 'ms-powerpoint',
    'sldx': 'ms-powerpoint',
    'sldm': 'ms-powerpoint'
  };

  constructor(
    private alfrescoApiService: AlfrescoApiService,
    private alfrescoAuthenticationService: AlfrescoAuthenticationService,
    private appConfigService: AppConfigService,
    private notificationService: NotificationService,
    private documentActionService: DocumentActionsService,
    private translationService: AlfrescoTranslationService
  ) {
    documentActionService.setHandler(
      'aos-edit-online',
      this.onActionEditOnlineAos.bind(this));
  }

  onActionEditOnlineAos(nodeId: string): Observable<boolean> {

    let opts = {
      include: ['isLocked', 'path']
    };

    return Observable.fromPromise(this.alfrescoApiService.getInstance().core.nodesApi.getNode(nodeId, opts)
      .then((data: any) => {
        if (data) {
          let node = data.entry;
          if (node.isFile) {
            if (node.isLocked) {
              let checkedOut = node.aspectNames.contains('cm:checkedOut');
              let lockOwner = node.properties['cm:lockOwner'];
              let differentLockOwner = lockOwner.id !== this.alfrescoAuthenticationService.getEcmUsername();

              if (checkedOut && differentLockOwner) {
                this.onAlreadyLockedNotification(node.id, lockOwner);
                return false;
              } else {
                this.triggerEditOnlineAos(node);
                return true;
              }
            } else {
              this.triggerEditOnlineAos(node);
              return true;
            }
          }
        }
      })
    );
  }

  private getUserAgent(): string {
    return navigator.userAgent.toLowerCase();
  }

  private isWindows(): boolean {
    return this.getUserAgent().indexOf('win') !== -1 ? true : false;
  }

  private isMacOs(): boolean {
    return this.getUserAgent().indexOf('mac') !== -1 ? true : false;
  }

  private onAlreadyLockedNotification(nodeId: string, lockOwner: string) {
      this.notificationService.openSnackMessage(`Document {nodeId} locked by {lockOwner}`, 3000);
  }

  private getProtocolForFileExtension(fileExtension: string) {
      return AOSEditOnlineService.MS_PROTOCOL_NAMES[fileExtension];
  }

  private triggerEditOnlineAos(node: any): void {

    let url = this.onlineEditUrlAos(node);
    let fileExtension = node.name.split('.').pop() !== null ? node.name.split('.').pop().toLowerCase() : '';
    let protocolHandler = this.getProtocolForFileExtension(fileExtension);

    if (protocolHandler === undefined) {
        let message: any = this.translationService.get('AOS.ERROR.NO_PROTOCOL_HANDLER');
        this.notificationService.openSnackMessage(message.value, 3000);
        return;
    }

    if (!this.isWindows() && !this.isMacOs()) {
        let message: any = this.translationService.get('AOS.ERROR.UNSUPPORTED_CLIENT_OS');
        this.notificationService.openSnackMessage(message.value, 3000);
    } else {
        this.aos_tryToLaunchOfficeByMsProtocolHandler(protocolHandler, url);
    }
  }

  private onlineEditUrlAos(node: any): string {

    let pathElements = node.path.elements.slice(1, node.path.elements.length);
    let path = '/';
    for (let element of pathElements) {
      path = path + element.name + '/';
    }

    let ecmHost = this.appConfigService.get<string>(AOSEditOnlineService.ECM_HOST_CONFIG_KEY);
    let url = ecmHost + '/alfresco/aos' + path + '/' + node.name;
    if (encodeURI(url).length > 256) {
      url = ecmHost + '/alfresco/aos/' + '_aos_nodeid' + '/' + node.id + '/' + node.name;
    }
    return url;
  }


  private aos_tryToLaunchOfficeByMsProtocolHandler(protocolHandler: string, url: string) {
    let protocolUrl = protocolHandler + ':ofe%7Cu%7C' + url;
    let protocolHandlerPresent = false;

    let input = document.createElement('input');
    let inputTop = document.body.scrollTop + 10;
    input.setAttribute('style', 'z-index: 1000; background-color: rgba(0, 0, 0, 0); border: none; outline: none; position: absolute; left: 10px; top: ' + inputTop + 'px;');
    document.getElementsByTagName('body')[0].appendChild(input);
    input.focus();
    input.onblur = function() {
      protocolHandlerPresent = true;
    };
    location.href = protocolUrl;
    let that = this;
    setTimeout(function() {
      input.onblur = null;
      input.remove();
      if (!protocolHandlerPresent) {
          let message: any = that.translationService.get('AOS.ERROR.UNSUPPORTED_CLIENT_VERSION');
          that.notificationService.openSnackMessage(message.value, 3000);
      }
    }, 500);
  }

}

