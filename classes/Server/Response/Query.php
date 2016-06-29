<?php

namespace WeBWorK\Server\Response;

/**
 * Response query.
 *
 * @since 1.0.0
 */
class Query {
	protected $r;

	public function __construct( $args ) {
		$this->r = array_merge( array(
			'question_id__in' => null,
			'orderby' => 'votes',
		), $args );

		$this->sorter = new \WeBWorK\Server\Util\QuerySorter();
	}

	/**
	 * Get responses.
	 *
	 * @since 1.0.0
	 *
	 * @return array|int
	 */
	public function get() {
		$args = array(
			'post_type' => 'webwork_response',
			'update_post_term_cache' => false,
			'meta_query' => array(),
			'posts_per_page' => -1,
			'orderby' => 'post_date',
			'order' => 'ASC',
		);


		if ( null !== $this->r['question_id__in'] ) {
			if ( array() === $this->r['question_id__in'] ) {
				$question_id__in = array( 0 );
			} else {
				$question_id__in = array_map( 'intval', $this->r['question_id__in'] );
			}

			$args['meta_query']['question_id__in'] = array(
				'key' => 'webwork_question_id',
				'value' => $question_id__in,
				'compare' => 'IN',
			);
		}

		$response_query = new \WP_Query( $args );
		$_responses = $response_query->posts;

		$responses = array();
		foreach ( $_responses as $_response ) {
			$responses[ $_response->ID ] = new \WeBWorK\Server\Response( $_response->ID );
		}

		$responses = $this->sorter->sort_by_votes( $responses );

		return $responses;
	}

	public function get_for_endpoint() {
		$responses = $this->get();

		$formatted = array();
		foreach ( $responses as $r ) {
			$response_id = $r->get_id();
			$formatted[ $response_id ] = array(
				'responseId' => $response_id,
				'content' => $r->get_content(),
				'questionId' => $r->get_question_id(),
				'authorAvatar' => $r->get_author_avatar(),
				'authorName' => $r->get_author_name(),
				'authorUserType' => $r->get_author_type_label(),
				'isAnswer' => $r->get_is_answer(),
			);
		}

		return $formatted;
	}
}
