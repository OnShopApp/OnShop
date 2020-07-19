import { environment } from '../../../../../environments/environment';

export class CategoryModel {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: CategoryImage;
  count: number;
  parent: number;
  subCategories: CategoryModel[] = [];

  constructor(init?: Partial<CategoryModel>) {
    this.image = new CategoryImage();
    Object.assign(this as any, init);
  }

  mapFromDto(dto: any) {
    this.id = Number(dto.id);
    this.name = dto.name;
    this.slug = dto.slug;
    this.description = dto.status;
    this.count = dto.count;
    this.parent = dto.parent;
    if (dto.image) {
      this.image.mapFromDto(dto.image);
    }
  }
}

export class CategoryImage {
  id: number;
  name: string;
  src: string;
  externalPath: boolean;

  mapFromDto(dto: any) {
    this.id = dto.id;
    this.name = dto.name;
    this.src = dto.externalPath ? `${dto.src}` : `${environment.apiBaseUrl}/${dto.src}`;
  }
}
