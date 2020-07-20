import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { OWL_CAROUSEL, UnsubscribeMixin } from '../../../core';
import { ProductFilter, ProductModel, ProductRepository } from '../../../data';
import { CartItemEntity, CartService, ProductService } from '../../../domain';
import { AppMapper } from '../../_mapper';

@Component({
  selector: 'app-product-details',
  styleUrls: ['./product-details.component.scss'],
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent extends UnsubscribeMixin() implements OnInit {
  public product = new ProductModel();
  public relatedProducts: Array<ProductModel> = [];
  public productCount = 1;

  public dateFrom: Date;
  public dateTo: Date;
  public dateFromMinDate: Date;
  public dateToMinDate: Date;

  public relatedProductsLoaded: boolean;
  public addingProductInProgress: boolean;
  public productLoaded: boolean;

  public readonly daysMapping: { [k: string]: string } = {
    '=0': 'days.',
    '=1': 'day',
    other: `days`,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productRepository: ProductRepository,
    private cartService: CartService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap((params) =>
          this.productRepository.getProducts(new ProductFilter({ slug: params.slug })).pipe(
            tap((productSearchResult) => {
              this.product = productSearchResult.items[0];
              this.dateFrom = moment().add(1, 'days').toDate();
              this.dateTo = moment()
                .add(this.product.availableDaysForRentAmount + 1, 'days')
                .toDate();
              this.dateFromMinDate = moment().add(1, 'days').toDate();
              this.dateToMinDate = moment()
                .add(this.product.availableDaysForRentAmount + 1, 'days')
                .toDate();
            }),
            finalize(() => (this.productLoaded = true)),
            switchMap(() => {
              return this.productRepository
                .getProducts(new ProductFilter({ include: this.product.relatedIds.join(',') }))
                .pipe(
                  tap((relatedProducts) => {
                    this.relatedProducts = relatedProducts.items;
                  }),
                  finalize(() => {
                    // by the end remove loader and init owl carousel
                    this.relatedProductsLoaded = true;
                    setTimeout(() => {
                      (window as any).$('.product-images').owlCarousel(OWL_CAROUSEL.PRODUCT_IMAGES);
                      (window as any).$('.related-carousel').owlCarousel(OWL_CAROUSEL.DEFAULT_SETTINGS);
                    });
                  })
                );
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  public rent() {
    const cartItem = AppMapper.toCartForRentItem(this.product, this.daysAmount, this.dateFrom, this.dateTo);
    this.addToCart(cartItem);
  }

  public buy() {
    const cartItem = AppMapper.toCartForSaleItem(this.product, this.productCount);
    this.addToCart(cartItem);
  }

  private addToCart(cartItem: CartItemEntity) {
    this.addingProductInProgress = true;
    this.cartService.addItem(cartItem);
    this.snackBar.open('Item added to cart', null, {
      duration: 2000,
    });
  }

  public get daysAmount(): number {
    const dateFrom = moment(this.dateFrom);
    const dateTo = moment(this.dateTo);
    return Math.ceil(dateTo.diff(dateFrom, 'h') / 24);
  }

  public get rentPrice(): number {
    return this.productService.getPriceForRent(this.product.rentRates, this.daysAmount);
  }

  public onDateFromChange() {
    this.dateTo = moment(this.dateFrom).add(this.product.availableDaysForRentAmount, 'days').toDate();
    this.dateToMinDate = moment(this.dateFrom).add(this.product.availableDaysForRentAmount, 'days').toDate();
  }
}
