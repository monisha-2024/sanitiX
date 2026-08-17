import React from 'react';

const About: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl mb-4">About SanitiX AI</h1>
      <section>
        <h2>Overview</h2>
        <p>SanitiX AI utilizes advanced algorithms to predict odour pollution in real-time.</p>
      </section>
      <section>
        <h2>Problem</h2>
        <p>Odour pollution is a major public health concern affecting many communities.</p>
      </section>
      <section>
        <h2>Solution</h2>
        <p>Our AI model anticipates risky odour occurrences and issues warnings.</p>
      </section>
      <section>
        <h2>AI Methodology</h2>
        <p>We employ machine learning techniques to analyze sensor data and provide predictions.</p>
      </section>
      <section>
        <h2>How to Replace Model</h2>
        <p>Instructions on model replacement will be available soon.</p>
      </section>
      <section>
        <h2>How to Connect IoT</h2>
        <p>We support various IoT devices to gather necessary data.</p>
      </section>
      <section>
        <h2>Tech Stack</h2>
        <table className="min-w-full border-collapse border border-gray-700">
          <thead>
            <tr>
              <th className="border border-gray-600">Technology</th>
              <th className="border border-gray-600">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-600">React</td>
              <td className="border border-gray-600">Frontend library</td>
            </tr>
            <tr>
              <td className="border border-gray-600">TypeScript</td>
              <td className="border border-gray-600">Type-safe JavaScript</td>
            </tr>
            <tr>
              <td className="border border-gray-600">Tailwind CSS</td>
              <td className="border border-gray-600">Utility-first CSS framework</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default About;
