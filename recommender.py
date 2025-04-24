from flask import Flask, request, jsonify
import pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# Loading pickled objects
with open('course_df.pkl', 'rb') as f:
    course_df = pickle.load(f)

with open('count_vectorizer.pkl', 'rb') as f:
    vectorizer = pickle.load(f)

with open('stemmer.pkl', 'rb') as f:
    stemmer = pickle.load(f)

with open('similarity_metrix.pkl', 'rb') as f:
    similarity_metrix = pickle.load(f)

def recommend_courses(search_query, difficulty_level, course_df, vectorizer, stemmer):
    # Stem and preprocess the search query
    search_query = " ".join([stemmer.stem(word) for word in search_query.lower().split()])
    
    search_vector = vectorizer.transform([search_query]).toarray()
    
    similarity_scores = cosine_similarity(search_vector, vectorizer.transform(course_df['tags']).toarray())
    
    sorted_indices = np.argsort(similarity_scores[0])[::-1]
    
    
    recommendations = []
    for idx in sorted_indices:
        if course_df.iloc[idx]['Difficulty Level'].lower() == difficulty_level.lower():
            recommendations.append({
                'Course Name': course_df.iloc[idx]['Course Name'],
                'University': course_df.iloc[idx]['University'],
                'Rating': course_df.iloc[idx]['Course Rating'],
                'URL': course_df.iloc[idx]['Course URL']
            })
        
        if len(recommendations) >= 5:
            break
    
    return recommendations

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    try:
        
        data = request.get_json()
        search_query = data.get('search_query')
        difficulty_level = data.get('difficulty_level')

        if not search_query or not difficulty_level:
            return jsonify({'error': 'Missing search_query or difficulty_level'}), 400

        recommendations = recommend_courses(search_query, difficulty_level, course_df, vectorizer, stemmer)

        return jsonify({'recommendations': recommendations}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)