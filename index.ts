import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AOSEditOnlineService } from './src/services/aos-edit-online-service';
export * from './src/services/aos-edit-online-service';

@NgModule({
    imports: [CommonModule],
    declarations: [],
    providers: [AOSEditOnlineService],
    exports: []
})
export class Ng2AlfrescoAosEditonlineModule {
    static forRoot(opts: any = {}): ModuleWithProviders {

        return {
            ngModule: Ng2AlfrescoAosEditonlineModule,
            providers: [AOSEditOnlineService]
        };
    }
}
