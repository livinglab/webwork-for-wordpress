<?php

/**
 * @group question
 */
class WeBWork_Tests_Question extends WeBWorK_UnitTestCase {
	public function test_successful_save_for_existing_item() {
		$q = self::factory()->question->create( array(
			'problem_id' => 15,
			'tried' => 'foo tried',
		) );

		$question = new \WeBWorK\Server\Question( $q );

		$question->set_content( 'foo' );
		$question->set_tried( 'bar tried' );
		$question->set_problem_id( 20 );

		$saved = $question->save();

		$this->assertTrue( $saved );

		$new_question = new \WeBWorK\Server\Question( $q );
		$this->assertSame( 'foo', $new_question->get_content() );
		$this->assertSame( 20, $new_question->get_problem_id() );
		$this->assertSame( 'bar tried', $new_question->get_tried() );
	}

	public function test_successful_save_for_new_item() {
		$question = new \WeBWorK\Server\Question();

		$question->set_content( 'foo' );
		$question->set_problem_id( 20 );

		$saved = $question->save();

		$this->assertTrue( $saved );

		$new_question = new \WeBWorK\Server\Question( $question->get_id() );
		$this->assertSame( 'foo', $new_question->get_content() );
		$this->assertSame( 20, $new_question->get_problem_id() );
	}

	public function test_exists_false() {
		$q = new \WeBWorK\Server\Question( 999 );
		$this->assertFalse( $q->exists() );
	}

	public function test_exists_true() {
		$q = self::factory()->question->create();

		$question = new \WeBWorK\Server\Question( $q );

		$this->assertTrue( $question->exists() );
	}

	public function test_delete_should_fail_when_question_does_not_exist() {
		$question = new \WeBWorK\Server\Question( 999 );
		$this->assertFalse( $question->exists() );

		$this->assertFalse( $question->delete() );
	}

	/**
	 * @group bbg
	 */
	public function test_delete_success() {
		$q = self::factory()->question->create();

		$question = new \WeBWorK\Server\Question( $q );
		$this->assertTrue( $question->exists() );

		$this->assertTrue( $question->delete() );

		$question_2 = new \WeBWorK\Server\Question( $q );
		$this->assertFalse( $question_2->exists() );
	}

	public function test_vote_count_should_default_to_zero() {
		$this->markTestSkipped( 'todo' );

		$q = self::factory()->question->create();

		$question = new \WeBWorK\Server\Question( $q );

		$this->assertSame( 0, $question->get_vote_count() );
	}

	public function test_set_post_date() {
		$q = self::factory()->question->create();

		$question = new \WeBWorK\Server\Question( $q );

		$new_date = '2015-05-05 05:05:05';
		$question->set_post_date( $new_date );

		$this->assertTrue( $question->save() );

		$question2 = new \WeBWorK\Server\Question( $q );
		$this->assertSame( $new_date, $question2->get_post_date() );
	}
}