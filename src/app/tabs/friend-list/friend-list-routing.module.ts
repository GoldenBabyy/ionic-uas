import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FriendListPage } from './friend-list.page';

const routes: Routes = [
  {
    path: '',
    component: FriendListPage
  },
  {
    path: 'add',
    loadChildren: () => import('./add/add.module').then( m => m.AddPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FriendListPageRoutingModule {}