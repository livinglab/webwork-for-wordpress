import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchProblem } from '../actions'
import ProblemSummary from '../components/ProblemSummary'
import AskQuestion from '../components/AskQuestion'
import QuestionList from '../components/QuestionList'

class AsyncApp extends Component {
	constructor( props ) {
		super( props )
	}

	componentDidMount() {
		this.props.dispatch( fetchProblem( '101010104019' ) );
	}

	render() {
		const { problem, questions, questionsById } = this.props

		return (
			<div className="ww-problem">
				<h2>{problem.title}</h2>
				<ProblemSummary content={problem.content} />

				<AskQuestion problem_id={problem.ID} />
				<QuestionList
					problem_id={problem.ID}
					questions={questions}
					questionsById={questionsById}
					/>
			</div>
		);
	}
}

function mapStateToProps( state ) {
	const { problem, questions, questionsById } = state

	return {
		problem,
		questions,
		questionsById
	}
}

export default connect( mapStateToProps )( AsyncApp )
