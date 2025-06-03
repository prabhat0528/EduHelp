from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
import nltk
from nltk.stem.porter import PorterStemmer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Initialize Flask
app = Flask(__name__)
CORS(app)

nltk.download('punkt')

stemmer = PorterStemmer()

course_df = pd.read_csv('Coursera.csv')
course_df['tags'] = course_df['Course Description'] + " " + course_df['Skills']
course_df = course_df[['Course Name', 'University', 'Difficulty Level', 'Course Rating', 'Course URL', 'tags']]

def tag_stemmer(text):
    return " ".join([stemmer.stem(word) for word in text.split()]).lower()

course_df['tags'] = course_df['tags'].apply(tag_stemmer)

cv = CountVectorizer(max_features=4000, stop_words='english')
cv_matrix = cv.fit_transform(course_df['tags'])

# Recommendation logic
def recommend_courses(search_query, difficulty_level):
    if not isinstance(search_query, str) or not isinstance(difficulty_level, str):
        raise ValueError("Invalid input types.")

    processed_query = tag_stemmer(search_query)
    query_vector = cv.transform([processed_query])

    similarity_scores = cosine_similarity(query_vector, cv_matrix)
    sorted_indices = np.argsort(similarity_scores[0])[::-1]

    recommendations = []
    for idx in sorted_indices:
        course = course_df.iloc[idx]
        if course['Difficulty Level'].strip().lower() == difficulty_level.strip().lower():
            recommendations.append({
                'Course Name': course['Course Name'],
                'University': course['University'],
                'Rating': course['Course Rating'],
                'URL': course['Course URL']
            })
        if len(recommendations) >= 5:
            break

    return recommendations

# Route to handle recommendations
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.get_json(force=True)
        topic = data.get('topic', '').strip()
        difficulty = data.get('difficulty', '').strip()

        if not topic or not difficulty:
            return jsonify({'error': 'Missing topic or difficulty'}), 400

        recommendations = recommend_courses(topic, difficulty)
        return jsonify(recommendations if recommendations else [])

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
