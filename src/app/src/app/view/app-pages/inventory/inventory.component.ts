import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { delay, distinctUntilChanged, filter, finalize, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';

import { UnsubscribeMixin } from '../../../core';
import {
  CategoryModel,
  CategoryRepository,
  ProductFilter,
  ProductRepository,
  ProductSearchResult,
  SearchResultFilters,
  TagModel,
} from '../../../data';
import { CartService, FilterFormData, SortingOption } from '../../../domain';
import { FilterDialogComponent } from './filter-dialog';

interface FilterState {
  productFilter: ProductFilter;
}

@Component({
  selector: 'app-inventory-page',
  styleUrls: ['./inventory.component.scss'],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent extends UnsubscribeMixin() implements OnInit {
  public filterUpdated$ = new Subject<{ productFilter: ProductFilter }>();

  public searchResult = new ProductSearchResult();
  public category: CategoryModel = new CategoryModel();
  public filter: SearchResultFilters;
  public itemsPerPage = new FormControl(50);
  public availableItemsPerPage = [50, 100, 200];
  public tags: TagModel[];
  public isInProgress: boolean;
  public showTags: boolean;
  public tagsLoaded: boolean;

  public isFirstLoading = true;

  private element: HTMLElement;
  private filterState: FilterState;

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private productRepository: ProductRepository,
    private categoryRepository: CategoryRepository,
    private cartService: CartService,
    private activatedRoute: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (!params.categoryId) {
        this.showTags = true;
      }
      // Initiate state for filters
      this.filterState = {
        productFilter: new ProductFilter({
          page: this.activatedRoute.snapshot.queryParams?.page || 1,
          category: !params.categoryId ? '' : params.categoryId,
          per_page: this.itemsPerPage.value,
          orderby: 'title',
          order: 'asc',
        }),
      };
      this.filterUpdated$.next(this.filterState);
    });

    this.productRepository
      .getTags()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.tagsLoaded = true))
      )
      .subscribe((tags) => {
        this.tags = tags;
      });

    // Stream which is responsible for filtering products on the page based on filters
    this.filterUpdated$
      .pipe(
        startWith(this.filterState),
        tap(() => (this.isInProgress = true)),
        switchMap((filterState: FilterState) =>
          this.productRepository.getProducts(filterState.productFilter).pipe(
            tap(() => {
              this.isFirstLoading = false;
              this.isInProgress = false;
              this.filterState = filterState;
              this.updateUrl(filterState);
            }),
            finalize(() => this.scrollToView())
          )
        ),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.searchResult = data;
      });
  }

  public onPageChanged(page: number) {
    const filterState = { ...this.filterState };
    filterState.productFilter.page = page;
    this.filterUpdated$.next(filterState);
  }

  public onItemsPerPageChanged(number: number) {
    const filterState = { ...this.filterState };
    filterState.productFilter.per_page = number;
    this.filterUpdated$.next(filterState);
  }

  public onSortTypeChanged($event: SortingOption) {
    const filterState = { ...this.filterState };
    filterState.productFilter.order = $event.property;
    filterState.productFilter.orderby = $event.name;
    this.filterUpdated$.next(filterState);
  }

  public onFilterChanged($event: FilterFormData) {
    const filterState = { ...this.filterState };
    filterState.productFilter.tag = $event.tag;

    this.filterUpdated$.next(filterState);
  }

  private updateUrl(productFilter: FilterState) {
    this.router.navigate([], {
      queryParams: { page: productFilter.productFilter.page },
    });
  }

  private scrollToView() {
    if (!document.getElementById('scrollView')) {
      return;
    }
    this.element = document.getElementById('scrollView') as HTMLElement;
    this.element.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  public get currentPage(): number {
    return this.filterState.productFilter.page;
  }

  public get totalResults(): number {
    return this.searchResult.totalCount;
  }

  public openFilters() {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      width: '300px',
    });
    dialogRef.componentInstance.tags = this.tags;

    dialogRef
      .afterClosed()
      .pipe(
        filter((data) => data),
        takeUntil(this.destroy$)
      )
      .subscribe((filters: FilterFormData) => {
        this.onFilterChanged(filters);
      });
  }
}
