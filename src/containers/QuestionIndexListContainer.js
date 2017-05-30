import { connect } from 'react-redux'
import QuestionIndexList from '../components/QuestionIndexList'
import { fetchQuestionIndexList } from '../actions/questions'

const mapStateToProps = ( state ) => {
	return {
		isLoading: state.appIsLoading,
		questionIds: state.questionsById
	}
}

const mapDispatchToProps = ( dispatch ) => {
	return {
		onComponentWillMount: function() {
			dispatch( fetchQuestionIndexList( true ) )
		}
	}
}

const QuestionListContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(QuestionIndexList)

export default QuestionListContainer
