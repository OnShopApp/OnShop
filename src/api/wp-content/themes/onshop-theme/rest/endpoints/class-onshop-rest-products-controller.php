<?php

defined( 'ABSPATH' ) || exit;

/**
 * REST API Products controller class.
 *
 * @extends
 */
class ONSHOP_REST_Products_Controller extends WC_REST_Products_Controller {
	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'onshop/v1/';

	/**
	 * Route registration
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'product',
			[
				[
					'methods'  => WP_REST_Server::READABLE,
					'callback' => function ( WP_REST_Request $request ) {
						$query_args = $this->prepare_objects_query( $request );

						$filter_str = $request->get_param( 'filter' );

						if ( ! empty( $filter_str ) ) {
							$filter_labeled = json_decode( $filter_str, true );

							$query_args['tax_query'] = array_merge($query_args['tax_query'], $this->get_tax_query( $filter_labeled ));
						}

						$query_results = $this->get_objects( $query_args );

						$objects = [];
						foreach ( $query_results['objects'] as $object ) {
							$data      = $this->prepare_object_for_response( $object, $request );
							$objects[] = $this->prepare_response_for_collection( $data );
						}

						$page      = (int) $query_args['paged'];
						$max_pages = $query_results['pages'];

						$response = rest_ensure_response( $objects );
						$response->header( 'X-WP-Total', $query_results['total'] );
						$response->header( 'X-WP-TotalPages', (int) $max_pages );

						$base          = $this->rest_base;
						$attrib_prefix = '(?P<';
						if ( strpos( $base, $attrib_prefix ) !== false ) {
							$attrib_names = array();
							preg_match( '/\(\?P<[^>]+>.*\)/', $base, $attrib_names, PREG_OFFSET_CAPTURE );
							foreach ( $attrib_names as $attrib_name_match ) {
								$beginning_offset = strlen( $attrib_prefix );
								$attrib_name_end  = strpos( $attrib_name_match[0], '>', $attrib_name_match[1] );
								$attrib_name      = substr( $attrib_name_match[0], $beginning_offset, $attrib_name_end - $beginning_offset );
								if ( isset( $request[ $attrib_name ] ) ) {
									$base = str_replace( "(?P<$attrib_name>[\d]+)", $request[ $attrib_name ], $base );
								}
							}
						}
						$base = add_query_arg( $request->get_query_params(), rest_url( sprintf( '/%s/%s', $this->namespace, $base ) ) );

						if ( $page > 1 ) {
							$prev_page = $page - 1;
							if ( $prev_page > $max_pages ) {
								$prev_page = $max_pages;
							}
							$prev_link = add_query_arg( 'page', $prev_page, $base );
							$response->link_header( 'prev', $prev_link );
						}
						if ( $max_pages > $page ) {
							$next_page = $page + 1;
							$next_link = add_query_arg( 'page', $next_page, $base );
							$response->link_header( 'next', $next_link );
						}

						$response->set_data( [
							'items'      => $response->get_data(),
							'filters'    => $this->get_filters( $query_args['tax_query'] ),
						] );

						return $response;
					},
					'args'     => $this->get_collection_params(),
				],
				'schema' => [ $this, 'get_public_item_schema' ],
			]
		);
		register_rest_route(
			$this->namespace,
			'product/(?P<id>\d+)',
			[
				'methods'  => WP_REST_Server::READABLE,
				'callback' => [ $this, 'get_item' ],
			]
		);
	}

	private function get_tax_query( $filter_labeled ) {
		$tax_query = [];

		global $wpdb;

		$labels_used_in_filter = array_map( function ( $el ) {
			return "'" . esc_sql( $el ) . "'";
		}, array_keys( $filter_labeled ) );

		// get all results in one db transaction to load to memory but faster processing
		$terms_with_taxonomy = $wpdb->get_results( "
				SELECT *
				FROM wp_term_taxonomy inner JOIN wp_terms ON wp_term_taxonomy.term_id=wp_terms.term_id
				    inner JOIN wp_woocommerce_attribute_taxonomies ON CONCAT('pa_', wp_woocommerce_attribute_taxonomies.attribute_name) = wp_term_taxonomy.taxonomy
				WHERE wp_woocommerce_attribute_taxonomies.attribute_label in (" . implode( ',', $labels_used_in_filter ) . ");
			"
		);

		foreach ( $filter_labeled as $attribute_label => $term_labels ) {
			$data_for_label = array_filter( $terms_with_taxonomy, function ( $row ) use ( $attribute_label ) {
				return $row->attribute_label === $attribute_label;
			} );

			if ( empty( $data_for_label ) ) {
				continue;
			}

			$term_ids = [];

			foreach ( $term_labels as $term_label ) {
				$rows = array_filter( $data_for_label, function ( $row ) use ( $term_label ) {
					return $row->name === $term_label;
				} );
				$row  = array_pop( $rows );

				$term_ids[] = $row->term_id;
			}

			$tax_query[] = [
				'taxonomy' => array_pop( $data_for_label )->taxonomy,
				'field'    => 'term_id',
				'terms'    => $term_ids
			];
		}

		return $tax_query;
	}

	private function get_filters( $tax_query ) {
		global $wpdb;

		$attributes = [];

		/*
		 * wp_posts.post_type = 'product' are records for products
		 * wp_term_taxonomy.taxonomy LIKE 'pa_%' are records for custom products attribute per attribute value
		 * wp_term_relationships is many-to-many between products and product attributes types
		 * wp_term_taxonomy is many-to-many between product attribute types and products attribute values
		 */
		$rows = $wpdb->get_results( "
			SELECT 
			       wp_term_taxonomy.term_taxonomy_id as pa_id,
			       wp_term_taxonomy.taxonomy as pa_key,
			       wp_terms.term_id as pa_term_id,
			       wp_terms.name as pa_term_value,
			       wp_woocommerce_attribute_taxonomies.attribute_label as pa_name,
			       count(wp_posts.id) as count
			FROM wp_posts, wp_term_relationships, wp_term_taxonomy, wp_terms, wp_woocommerce_attribute_taxonomies
			WHERE wp_posts.id = wp_term_relationships.object_id AND
			      wp_term_relationships.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id AND
			      wp_term_taxonomy.term_id = wp_terms.term_id AND
			      CONCAT('pa_', wp_woocommerce_attribute_taxonomies.attribute_name) = wp_term_taxonomy.taxonomy AND
			      wp_term_taxonomy.taxonomy LIKE 'pa_%'
			GROUP BY wp_terms.term_id
		" );

		foreach ( $rows as $row ) {
			if ( empty( $attributes[ $row->pa_name ] ) ) {
				$attributes[ $row->pa_name ] = [
					'name'         => $row->pa_name,
					'filter_items' => [
						[
							'name'       => $row->pa_term_value,
							'is_checked' => $this->is_term_checked( $tax_query, $row->pa_key, $row->pa_term_id ),
							'count'      => $row->count,
						]
					]
				];
			} else {
				$attributes[ $row->pa_name ]['filter_items'][] = [
					'name'       => $row->pa_term_value,
					'is_checked' => $this->is_term_checked( $tax_query, $row->pa_key, $row->pa_term_id ),
					'count'      => $row->count,
				];
			}
		}

		$attributes = array_values( $attributes );

		$prices = $wpdb->get_row( "
	     	select min(meta_value) as min_price, max(meta_value) as max_price
			from wp_posts, wp_postmeta
			where wp_posts.ID = wp_postmeta.post_id AND wp_posts.post_type = 'product'
			AND wp_postmeta.meta_key = '_price';
	     " );

		$attributes[] = [
			'name' => 'Price',
			'min'  => $prices->min_price,
			'max'  => $prices->max_price,
		];

		return $attributes;
	}

	private function is_term_checked( $tax_query, $pa_key, $pa_term_id ) {
		$filtered = array_filter( $tax_query, function ( $el ) use ( $pa_key, $pa_term_id ) {
			return $el['taxonomy'] === $pa_key && in_array( $pa_term_id, $el['terms'] );
		} );

		return ! empty( $filtered );
	}
}
