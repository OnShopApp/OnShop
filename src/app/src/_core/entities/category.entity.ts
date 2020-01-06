export class CategoryEntity {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: CategoryImage;
  count: number;

  constructor() {
    this.image = new CategoryImage();
  }

  /// mappers
  mapFromDto(dto: any) {
    this.id = dto.id;
    this.name = dto.name;
    this.slug = dto.slug;
    this.description = dto.status;
    this.count = dto.count;
    if (dto.image) {
      this.image.mapFromDto(dto.image);
    }
  }
}

export class CategoryImage {
  id: number;
  name: string;
  src: string;

  mapFromDto(dto: any) {
    this.id = dto.id;
    this.name = dto.name;
    this.src = dto.src;
  }
}
