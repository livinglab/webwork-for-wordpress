import { connect } from 'react-redux'
import QuestionIndexList from '../components/QuestionIndexList'
import { fetchQuestionIndexList } from '../actions/questions'

const mapStateToProps = ( state ) => {
	return {
		questionIds: state.questionsById
	}
}

const mapDispatchToProps = ( dispatch ) => {
	return {
		// @todo Pagination?
		onComponentWillMount: function() {
			dispatch( fetchQuestionIndexList() )
		}
	}
}

const QuestionListContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(QuestionIndexList)

export default QuestionListContainer