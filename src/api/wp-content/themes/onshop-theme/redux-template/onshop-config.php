<?php

if ( ! class_exists( 'Redux' ) ) {
	return;
}

$opt_name = "redux_demo";

$args = array(
	'menu_title'           => __( 'Shop Options', 'shop-options' ),
	'page_title'           => __( 'Shop Options', 'shop-options' ),
	'page_icon'            => 'icon-themes',
	'page_slug'            => '_options',
	'dev_mode'             => false
);

Redux::setArgs( $opt_name, $args );

Redux::setSection( $opt_name, array(
	'title'  => __( 'Contacts', 'redux-framework-demo' ),
	'id'     => 'contacts',
	'desc'   => __( 'Basic field with no subsections.', 'redux-framework-demo' ),
	'icon'   => 'el el-home',
	'fields' => array(
		array(
			'id'       => 'opt-email',
			'type'     => 'text',
			'title'    => __( 'Email', 'redux-framework-demo' ),
			'subtitle' => __( 'Your shop email address', 'redux-framework-demo' )
		),
		array(
			'id'       => 'opt-address',
			'type'     => 'text',
			'title'    => __( 'Address', 'redux-framework-demo' ),
			'subtitle' => __( 'Example subtitle.', 'redux-framework-demo' )
		),
		array(
			'id'       => 'opt-phone-1',
			'type'     => 'text',
			'title'    => __( 'Phone #1', 'redux-framework-demo' ),
			'subtitle' => __( 'Example subtitle.', 'redux-framework-demo' )
		),
		array(
			'id'       => 'opt-phone-2',
			'type'     => 'text',
			'title'    => __( 'Phone #2', 'redux-framework-demo' ),
			'subtitle' => __( 'Example subtitle.', 'redux-framework-demo' )
		)
	)
));

Redux::setSection( $opt_name, array(
	'title'  => __( 'Settings', 'redux-framework-demo' ),
	'id'     => 'settings',
	'desc'   => __( 'Basic field with no subsections.', 'redux-framework-demo' ),
	'icon'   => 'el el-home',
	'fields' => array(
		array(
			'id'       => 'opt-title',
			'type'     => 'text',
			'title'    => __( 'App Title', 'redux-framework-demo' ),
			'subtitle' => __( 'Logo', 'redux-framework-demo' )
		),
		array(
			'id'       => 'opt-logo-url',
			'type'     => 'text',
			'title'    => __( 'App Logo', 'redux-framework-demo' ),
			'subtitle' => __( 'Logo image URL.', 'redux-framework-demo' )
		)
	)
));
