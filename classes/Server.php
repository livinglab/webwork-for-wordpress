<?php

namespace WeBWorK;

/**
 * Server.
 *
 * @since 1.0.0
 */
class Server {
	protected $post_data;
	protected $remote_class_url;
	protected $webwork_user;

	public function __construct() {
		$this->schema = new Server\Schema();
		$this->schema->init();

		// temp
		$this->check_table();

		$problems_endpoint = new Server\Problem\Endpoint();
		add_action( 'rest_api_init', array( $problems_endpoint, 'register_routes' ) );

		$questions_endpoint = new Server\Question\Endpoint();
		add_action( 'rest_api_init', array( $questions_endpoint, 'register_routes' ) );

		$responses_endpoint = new Server\Response\Endpoint();
		add_action( 'rest_api_init', array( $responses_endpoint, 'register_routes' ) );

		$votes_endpoint = new Server\Vote\Endpoint();
		add_action( 'rest_api_init', array( $votes_endpoint, 'register_routes' ) );

		add_action( 'template_redirect', array( $this, 'catch_post' ) );
	}

	private function check_table() {
		global $wpdb;

		$table_prefix = $wpdb->get_blog_prefix( 1 );
		$show = $wpdb->get_var( "SHOW TABLES LIKE '{$table_prefix}'" );
		if ( ! $show ) {
			$schema = $this->schema->get_votes_schema();

			if ( ! function_exists( 'dbDelta' ) ) {
				require ABSPATH . '/wp-admin/includes/upgrade.php';
			}

			dbDelta( array( $schema ) );
		}
	}

	/**
	 * @todo This will only work for individual problems. Will need to differentiate for other uses.
	 * @todo Redirect afterward, break up logic into separate items, etc.
	 * @todo Forbid multiple problems for a given WW-individuated problem.
	 */
	public function catch_post() {
		// @todo
                if ( empty( $_GET['webwork'] ) || '1' != $_GET['webwork'] ) {
                        return;
                }

		if ( ! empty( $_POST ) ) {
			$this->set_post_data( $_POST );
			$this->set_remote_class_url( wp_unslash( $_SERVER['HTTP_REFERER'] ) );
		} else {
			if ( isset( $_GET['remote_class_url'] ) ) {
				$this->set_remote_class_url( wp_unslash( $_GET['remote_class_url'] ) );
			}

			if ( isset( $_GET['webwork_user'] ) ) {
				$this->webwork_user = wp_unslash( $_GET['webwork_user'] );
			}

			if ( $this->webwork_user ) {
				$key = $this->get_post_data_option_key();
				$post_data = get_option( $key );

				if ( $post_data ) {
					$this->set_post_data( $post_data );

					// This data should never be reused across redirects.
					delete_option( $key );
				}
			}
		}

		// Store the submitted post data, so it's available after a redirect.
		$this->store_post_data();

		// For the time being, all requests must be authenticated.
		// @todo Check permissions against client site - maybe share logic with endpoints.
		if ( ! is_user_logged_in() ) {
			$redirect_url = add_query_arg( array(
				'webwork' => 1,
				'webwork_user' => $this->webwork_user,
				'remote_class_url' => $this->remote_class_url,
			), home_url() );
			wp_safe_redirect( wp_login_url( $redirect_url ) );
			die();
		}

		$source = $this->remote_class_url;

		$problem = new Server\Problem();

		// Do not unslash. wp_insert_post() expocts slashed. A nightmare.
		$pg_object = base64_decode( $this->post_data['pg_object'] );

		// Replace LaTeX backslashes with dummy character, so they aren't stripped.
		// This will break with literal backslashes?
		$pf = new Server\Util\ProblemFormatter();
		$pg_object = $pf->swap_latex_escape_characters( $pg_object );

		$problem->set_content( $pg_object );
		$problem_library_id = $problem->get_library_id();

		// Route to existing problem, if it exists.
		$pq = new Server\Problem\Query( array(
			'library_id' => $problem_library_id,
		) );
		$matches = $pq->get();

		if ( $matches ) {
			$problem_id = reset( array_keys( $matches ) );
		} else {
			$problem->set_author_id( get_current_user_id() );

			// @todo I think this has to be fetched from referer URL.
			$problem->set_remote_url( 'http://example.com/test-url' );

			$problem->save();

			$problem_id = $problem->get_id();
		}

		// Get Client base URL from $source (the blog URL)
		$client_id = $this->get_client_from_course_url( $source );

		$client_base = get_blog_option( $client_id, 'home' );
		$client_url = trailingslashit( $client_base ) . 'webwork/problems/' . $problem_id;
		wp_safe_redirect( $client_url );
		die();
	}

	public function set_post_data( $data ) {
		$this->post_data = $data;
	}

	/**
	 * Sanitize a remote class URL.
	 *
	 * @since 1.0.0
	 *
	 * @param string $raw_url Raw URL from the HTTP_REFERER header.
	 * @return array URL parts.
	 */
	protected function sanitize_class_url( $raw_url ) {
		$parts = parse_url( $raw_url );

		// Raw URL may contain a set and problem subpath.
		$subpath = '';
		foreach ( array( 'set', 'problem' ) as $key ) {
			if ( ! empty( $_POST[ $key ] ) ) {
				$subpath .= trailingslashit( $_POST[ $key ] );
			}
		}

		$this->remote_referer_url = $parts['scheme'] . '://' . $parts['host'] . $parts['path'];

		if ( $subpath && $subpath === substr( $parts['path'], -strlen( $subpath ) ) ) {
			$base = substr( $parts['path'], 0, -strlen( $subpath ) );
		} else {
			$base = $parts['path'];
		}

		$base = trailingslashit( $parts['scheme'] . '://' . $parts['host'] . $base );

		$retval = array(
			'base' => $base,
			'effectiveUser' => '',
			'user' => '',
			'key' => '',
		);

		if ( ! empty( $parts['query'] ) ) {
			parse_str( $parts['query'], $query );
			foreach ( (array) $query as $k => $v ) {
				$retval[ $k ] = $v;
			}
		}

		return $retval;
	}

	/**
	 * Set the course URL for the request.
	 *
	 * @since 1.0.0
	 *
	 * @param string $remote_class_url
	 */
	public function set_remote_class_url( $remote_class_url ) {
		$url_parts = $this->sanitize_class_url( $remote_class_url );
		$this->remote_class_url = $url_parts['base'];
		$this->webwork_user = $url_parts['user'];
	}

	protected function get_client_from_course_url( $course_url ) {
		// @todo We need a better way to do this.
		$clients = get_option( 'webwork_clients', array() );

		$client = 0;
		if ( isset( $clients[ $course_url ] ) ) {
			$client = $clients[ $course_url ];
		}

		return (int) $client;
	}

	/**
	 * Get the key to be used when storing the POST data in the options table.
	 *
	 * @todo Does this need to use a timestamp? Seems like probably not?
	 *
	 * @since 1.0.0
	 *
	 * @param array $args {
	 *     @type string $ip   IP address. Falls back on REMOTE_ADDR.
	 *     @type string $user WW user name. Falls back on $this->webwork_user.
	 * }
	 * @return string
	 */
	protected function get_post_data_option_key( $args = array() ) {
		if ( isset( $args['ip'] ) ) {
			$ip = $args['ip'];
		} elseif ( isset( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip = wp_unslash( $_SERVER['REMOTE_ADDR'] );
		} else {
			$ip = '';
		}

		if ( isset( $args['user'] ) ) {
			$user = $args['user'];
		} else {
			$user = $this->webwork_user;
		}

		// If neither $ip or $user is available, don't store the data.
		if ( ! $ip && ! $user ) {
			return false;
		}

		return 'webwork_post_data_' . md5( $ip . $user );
	}

	/**
	 * Store POST and other data that will be needed after redirect.
	 *
	 * @since 1.0.0
	 */
	public function store_post_data() {
		$this->post_data_key = $this->get_post_data_option_key();

		// Store the remote class URL for later use.
		$this->post_data['remote_class_url']   = $this->remote_class_url;
		$this->post_data['remote_referer_url'] = $this->remote_referer_url;

		update_option( $this->post_data_key, $this->post_data );
	}
}
