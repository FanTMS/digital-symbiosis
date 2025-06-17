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
                {/* Фиксированная кнопка для мобильных */}
                <div className="fixed left-0 right-0 bottom-0 z-40 px-2 pb-3 animate-fade-in">
                    <button type="button" onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))} className="w-full py-4 text-base rounded-2xl shadow-xl bg-blue-500 text-white font-bold text-lg">Сохранить квиз</button>
                </div>
            </div>
        </div>
    );
};

export default QuizCreatePage; 