import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuizEditor from '../components/QuizEditor';
import { ChevronLeft } from 'lucide-react';

const QuizCreatePage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex flex-col items-center py-4 px-2 sm:px-0">
            <div className="w-full max-w-xl relative flex flex-col" style={{ minHeight: '80vh', paddingBottom: '90px' }}>
                <button onClick={() => navigate('/quizzes')} className="mb-4 flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium text-sm">
                    <ChevronLeft size={18} /> <span>К списку квизов</span>
                </button>
                <QuizEditor onSave={() => navigate('/quizzes')} />
            </div>
        </div>
    );
};

export default QuizCreatePage; 