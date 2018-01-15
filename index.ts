import { NgModule, ModuleWithProviders } from '@angular/core';

import { CoreModule, TRANSLATION_PROVIDER } from 'ng2-alfresco-core';
import { AOSEditOnlineService } from './src/services/aos-edit-online-service';
export * from './src/services/aos-edit-online-service';

@NgModule({
    imports: [CoreModule],
    declarations: [],
    providers: 
    [
        AOSEditOnlineService,
        {
            provide: TRANSLATION_PROVIDER,
            multi: true,
            useValue: {
                name: 'ng2-alfresco-aos-editonline',
                source: 'assets/ng2-alfresco-aos-editonline'
            }
        }
    ],
    exports: []
})
export class Ng2AlfrescoAosEditonlineModule {
}
