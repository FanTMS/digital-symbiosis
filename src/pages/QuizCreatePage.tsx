import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuizEditor from '../components/QuizEditor';

const QuizCreatePage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <QuizEditor onSave={() => navigate('/quizzes')} />
    );
};

export default QuizCreatePage; 