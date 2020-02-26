import {Component, Input} from '@angular/core';
import {CategoryModel} from '../../../../_data';

@Component({
  selector: 'app-category-item',
  styleUrls: ['./category-item.component.scss'],
  templateUrl: './category-item.component.html'
})
export class CategoryItemComponent {
  /// binding
  @Input() id: number;
  @Input() title: string;
  @Input() baseUrl: string;
  @Input() count: number;
  @Input() photo;
  @Input() subCategories: Array<CategoryModel>;

  /// fields
  public categories: Array<CategoryModel> = [];

  /// constructor
  constructor() {
  }
}
