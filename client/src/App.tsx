import React, { useState, useEffect, useCallback  } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import './ApplicationForm.css'
import ReviewerDashboard from './ReviewerDashboard';

interface JobPosting {
  id: string;
  approvalDate: string;
  approvedBy: string;
  datePosted: string;
  department: string;
  duties: string[];
  jobSummary: string;
  jobTitle: string;
  jobType: string;
  location: string;
  salaryRange: string;
  minimumQualifications: {
    education: string;
    experience: {
      agriculturalLoanAnalysis?: number;
      creditAnalysis?: number;
      farmBusinessManagement?: number;
      supervisoryAptitude?: boolean;
      totalYears: number;
      [key: string]: any;
    };
  };
  substitutions?: string[];
  otherRequirements?: string[];
}

function App() {
  const [jobs, setJobs] = useState<JobPosting[]>([]); 
  const [iJobs, setIJobs] = useState<JobPosting>(); 
  const [jobId, setJobId] = useState<String>('');
  const [loadingId, setLoadingId] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'jobs' | 'application' | 'reviewer'>('jobs');
  const [applicationData, setApplicationData] = useState({
    applicantId: '',
    question1: '',
    question2: '',
    question3: '',
    resume: null as File | null,
    jobApplication: null as File | null,
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const request_data: RequestInit = {
          // Use POST when sending a JSON body; body must be a string (or other BodyInit)
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // body: JSON.stringify({
          //   jobId: 'iqMUUWZ5S91fwpFLy3ka' // Example body data
          // })
        };

        const productResponse = await fetch('/api/jobListings', request_data);

        if (!productResponse.ok) {
          throw new Error(`HTTP error! status: ${productResponse.status}`);
        }

        const data = await productResponse.json();

        setJobs(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(err as any);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const getJobsById = useCallback(async (jobId: String) => {
    try {
      const request_data: RequestInit = {
        // Use POST when sending a JSON body; body must be a string (or other BodyInit)
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobId // Example body data
        })
      };
      const productResponse = await fetch('/api/jobListings', request_data);

      if (!productResponse.ok) {
        throw new Error(`HTTP error! status: ${productResponse.status}`);
      }
      const data = await productResponse.json();
      return data;
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(err as any);
    }
  }, []);

    useEffect(() => {
      if (jobId !== null) {
        console.log("Job ID set to:", jobId);
        // You can also call clickJobs() here if it depends on the updated jobId
        // clickJobs(); 
      }
    }, [jobId]);

  const clickJobs = async (jobIds: String) => {
    setLoadingId(true);
    try {
      const data = await getJobsById(jobIds);
      if (data) {
        setIJobs(data);
        console.log("Fetched job by ID:", data);
      }
    } catch (err) {
      console.error("Error fetching job by ID:", err);
    } finally {
      setLoadingId(true); // Keep it true to show the single job view
    }
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== APPLICATION FORM SUBMISSION ===");
    console.log("Application data:", applicationData);
    console.log("Job ID:", jobId);
    
    // Validate required fields before sending
    if (!applicationData.applicantId.trim()) {
      alert('Please enter your applicant ID');
      return;
    }
    if (!applicationData.question1.trim()) {
      alert('Please answer question 1');
      return;
    }
    if (!applicationData.question2.trim()) {
      alert('Please answer question 2');
      return;
    }
    if (!applicationData.question3.trim()) {
      alert('Please answer question 3');
      return;
    }
    if (!applicationData.resume) {
      alert('Please upload your resume');
      return;
    }
    
    // Prepare form data for file upload
    const formData = new FormData();
    formData.append('jobId', jobId as string);
    formData.append('applicantId', applicationData.applicantId);
    formData.append('question1', applicationData.question1);
    formData.append('question2', applicationData.question2);
    formData.append('question3', applicationData.question3);
    if (applicationData.resume) {
      formData.append('resume', applicationData.resume);
      console.log("Resume file:", { name: applicationData.resume.name, size: applicationData.resume.size });
    }
    if (applicationData.jobApplication) {
      formData.append('jobApplication', applicationData.jobApplication);
      console.log("Job application file:", { name: applicationData.jobApplication.name, size: applicationData.jobApplication.size });
    }

    console.log("Sending FormData to /api/submitApplication...");
    try {
      const response = await fetch('/api/submitApplication', {
        method: 'POST',
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", {
        contentType: response.headers.get('content-type'),
      });
      
      // Try to parse as JSON, but handle HTML errors
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Response is not JSON. Response text:", text);
        data = { error: 'Server returned an error. Check console for details.' };
      }
      
      console.log("Response data:", data);

      if (!response.ok) {
        const errorMessage = data.error || `HTTP error! status: ${response.status}`;
        console.error("Submission failed:", errorMessage);
        alert(`Failed to submit application: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log('Application submitted successfully:', data);
      alert('Application submitted successfully!');
      
      // Reset form and go back to jobs page
      setApplicationData({
        applicantId: '',
        question1: '',
        question2: '',
        question3: '',
        resume: null,
        jobApplication: null,
      });
      setCurrentPage('jobs');
    } catch (err) {
      console.error('=== APPLICATION SUBMISSION ERROR ===');
      console.error('Error:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      // Alert is already shown in the response handler above
    }
  }

  return (
    <>
      
      <div id="theme"> 
          <div id="backgroundCover"> 

          </div>

          <div id="wrap"> 
              
              <div className="sitewide-header"> 
                  <h1 id="sitewide-name"> MAKFR </h1>
                  <h3 id="sitewide-login"> Sign In </h3>
              </div>
      
        <div className="nav-header"> 
          <button className="nav-button" id="nav-selected" onClick={() => setCurrentPage('jobs')}> Apply </button>
          <button className="nav-button" onClick={() => setCurrentPage('reviewer')}> Review </button>
        </div>

              <div id="inner-wrap"> 
            
                  <div id="page"> 
                      
                      <div id="pageHeader"> </div>
                    
                      <div id="pageContent">
                          {currentPage === 'jobs' ? (
                          <div id="newPage"> 
                              <div className="pageNavBar"> 
                                  <div className="pageNavSearch"> Search </div>
                                  <div className="pageNavList">
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : error ? (
                                        <p>Error: {String(error)}</p>
                                    ) : (
                                      
                                      Array.isArray(jobs) && jobs.length > 0 ? (
                                        jobs.map(job => (
                                          <button key={job.jobTitle} onClick={() => {
                                            setJobId(job.id);
                                            clickJobs(job.id);
                                          }}> 
                                            <div className="pageNavItem"> 
                                                <h4>{job.jobTitle}</h4>
                                                <p> {job.department} </p>
                                            </div>
                                          </button>
                                        ))
                                      ) : (
                                        // This displays if data is not an array or is an empty array
                                        <p>No job postings found.</p>
                                      )
                                    )}
                                      
                                  </div>
                              </div>
                              <div className="pageCenter"> 
                                  <div className="pageCenterContent"> 
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : error ? (
                                        <p>Error: {String(error)}</p>
                                    ) : loadingId && iJobs ? (
                                        <div key={iJobs?.jobTitle}> 
                                          
                                            <div id="jobHeader">
                                                <div id="jobHeaderArea"> 
                                                    <div id="jobHeaderInfo"> 
                                                        <h1 id="jobHeaderName"> {iJobs?.jobTitle} </h1>
                                                        <p id="jobHeaderSub"> {iJobs?.department} </p>
                                                    </div>
                                                    <div id="jobHeaderActions"> 
                                                        <button id="applyButton" onClick={() => setCurrentPage('application')}> Apply </button>
                                                    </div>
                                                </div>
                                                <div id="jobHeaderMisc"> 
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Salary </h4>
                                                        <p> {iJobs?.salaryRange || 'N/A'} </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Location </h4>
                                                        <p> {iJobs?.location || 'Oahu'} </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Job Type </h4>
                                                        <p> {iJobs?.jobType || 'Various'} </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Department </h4>
                                                        <p> {iJobs?.department || 'DHRD'} </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Posted Date </h4>
                                                        <p> {iJobs?.datePosted || 'XX/XX/XX'} </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Approval Date </h4>
                                                        <p> {iJobs?.approvalDate || 'N/A'} </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div id="jobViewOptions"> 
                                              <button className="jobViewOptionItem" id="jobViewOptionItemSelected"> Description </button>
                                              <button className="jobViewOptionItem"> Benefits </button>
                                              <button className="jobViewOptionItem"> Questions </button>
                                            </div>
                                            <div id="jobView">
                                              <p><strong>Job Summary:</strong> {iJobs?.jobSummary}</p>
                                              <p><strong>Salary Range:</strong> {iJobs?.salaryRange}</p>
                                              <p><strong>Job Type:</strong> {iJobs?.jobType}</p>
                                              <p><strong>Location:</strong> {iJobs?.location}</p>
                                              <p><strong>Date Posted:</strong> {iJobs?.datePosted}</p>
                                              
                                              <div style={{ marginTop: '16px' }}>
                                                <strong>Duties:</strong>
                                                <ul>
                                                  {iJobs?.duties && iJobs.duties.map((duty, idx) => (
                                                    <li key={idx}>{duty}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                              
                                              <div style={{ marginTop: '16px' }}>
                                                <strong>Minimum Qualifications:</strong>
                                                <p><strong>Education:</strong> {iJobs?.minimumQualifications.education}</p>
                                                <p><strong>Total Experience Required:</strong> {iJobs?.minimumQualifications.experience.totalYears} years</p>
                                                {iJobs?.minimumQualifications.experience.agriculturalLoanAnalysis !== undefined && (
                                                  <p><strong>Agricultural Loan Analysis:</strong> {iJobs.minimumQualifications.experience.agriculturalLoanAnalysis} year(s)</p>
                                                )}
                                                {iJobs?.minimumQualifications.experience.creditAnalysis !== undefined && (
                                                  <p><strong>Credit Analysis:</strong> {iJobs.minimumQualifications.experience.creditAnalysis} year(s)</p>
                                                )}
                                                {iJobs?.minimumQualifications.experience.farmBusinessManagement !== undefined && (
                                                  <p><strong>Farm Business Management:</strong> {iJobs.minimumQualifications.experience.farmBusinessManagement} year(s)</p>
                                                )}
                                              </div>
                                              
                                              {iJobs?.substitutions && iJobs.substitutions.length > 0 && (
                                                <div style={{ marginTop: '16px' }}>
                                                  <strong>Substitutions:</strong>
                                                  <ul>
                                                    {iJobs.substitutions.map((sub, idx) => (
                                                      <li key={idx}>{sub}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              
                                              {iJobs?.otherRequirements && iJobs.otherRequirements.length > 0 && (
                                                <div style={{ marginTop: '16px' }}>
                                                  <strong>Other Requirements:</strong>
                                                  <ul>
                                                    {iJobs.otherRequirements.map((req, idx) => (
                                                      <li key={idx}>{req}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>                                            
                                          </div>
                                      ) : (
                                        Array.isArray(jobs) && jobs.length > 0 ? (
                                          jobs.map(job => (
                                            <div key={job.jobTitle}> 
                                            
                                              <div id="jobHeader">
                                                  <div id="jobHeaderArea"> 
                                                      <div id="jobHeaderInfo"> 
                                                          <h1 id="jobHeaderName"> {job.jobTitle} </h1>
                                                          <p id="jobHeaderSub"> {job.department} </p>
                                                      </div>
                                                      <div id="jobHeaderActions"> 
                                                          <button id="applyButton"> Apply </button>
                                                      </div>
                                                  </div>
                                                  <div id="jobHeaderMisc"> 
                                                      <div className="jobHeaderMiscItem"> 
                                                          <h4> Salary </h4>
                                                          <p> {job.salaryRange || 'N/A'} </p>
                                                      </div>
                                                      <div className="jobHeaderMiscItem"> 
                                                          <h4> Location </h4>
                                                          <p> {job.location || 'Oahu'} </p>
                                                      </div>
                                                      <div className="jobHeaderMiscItem"> 
                                                          <h4> Job Type </h4>
                                                          <p> {job.jobType || 'Various'} </p>
                                                      </div>
                                                      <div className="jobHeaderMiscItem"> 
                                                          <h4> Department </h4>
                                                          <p> {job.department || 'DHRD'} </p>
                                                      </div>
                                                      <div className="jobHeaderMiscItem"> 
                                                          <h4> Posted Date </h4>
                                                          <p> {job.datePosted || 'XX/XX/XX'} </p>
                                                      </div>
                                                      <div className="jobHeaderMiscItem"> 
                                                          <h4> Approval Date </h4>
                                                          <p> {job.approvalDate || 'N/A'} </p>
                                                      </div>
                                                  </div>
                                            </div>
                                            <div id="jobViewOptions"> 
                                              <button className="jobViewOptionItem" id="jobViewOptionItemSelected"> Description </button>
                                              <button className="jobViewOptionItem"> Benefits </button>
                                              <button className="jobViewOptionItem"> Questions </button>
                                            </div>
                                            <div id="jobView">
                                              <p><strong>Job Summary:</strong> {job.jobSummary}</p>
                                              <p><strong>Salary Range:</strong> {job.salaryRange}</p>
                                              <p><strong>Job Type:</strong> {job.jobType}</p>
                                              <p><strong>Location:</strong> {job.location}</p>
                                              <p><strong>Date Posted:</strong> {job.datePosted}</p>
                                              
                                              <div style={{ marginTop: '16px' }}>
                                                <strong>Duties:</strong>
                                                <ul>
                                                  {job.duties && job.duties.map((duty, idx) => (
                                                    <li key={idx}>{duty}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                              
                                              <div style={{ marginTop: '16px' }}>
                                                <strong>Minimum Qualifications:</strong>
                                                <p><strong>Education:</strong> {job.minimumQualifications.education}</p>
                                                <p><strong>Total Experience Required:</strong> {job.minimumQualifications.experience.totalYears} years</p>
                                                {job.minimumQualifications.experience.agriculturalLoanAnalysis !== undefined && (
                                                  <p><strong>Agricultural Loan Analysis:</strong> {job.minimumQualifications.experience.agriculturalLoanAnalysis} year(s)</p>
                                                )}
                                                {job.minimumQualifications.experience.creditAnalysis !== undefined && (
                                                  <p><strong>Credit Analysis:</strong> {job.minimumQualifications.experience.creditAnalysis} year(s)</p>
                                                )}
                                                {job.minimumQualifications.experience.farmBusinessManagement !== undefined && (
                                                  <p><strong>Farm Business Management:</strong> {job.minimumQualifications.experience.farmBusinessManagement} year(s)</p>
                                                )}
                                              </div>
                                              
                                              {job.substitutions && job.substitutions.length > 0 && (
                                                <div style={{ marginTop: '16px' }}>
                                                  <strong>Substitutions:</strong>
                                                  <ul>
                                                    {job.substitutions.map((sub, idx) => (
                                                      <li key={idx}>{sub}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              
                                              {job.otherRequirements && job.otherRequirements.length > 0 && (
                                                <div style={{ marginTop: '16px' }}>
                                                  <strong>Other Requirements:</strong>
                                                  <ul>
                                                    {job.otherRequirements.map((req, idx) => (
                                                      <li key={idx}>{req}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>                                            
                                          </div>
                                          ))
                                        ) : (
                                          <p>No job postings found.</p>
                                        )
                                      )
                                    }
                                      
                                      
                                  </div>
                              </div>
                          </div>
                          ) : currentPage === 'reviewer' ? (
                            <ReviewerDashboard />
                          ) : (
                            <div className="application-page">
                              <button onClick={() => setCurrentPage('jobs')} className="back-button">
                                ← Back to Jobs
                              </button>
                              
                              <div className="form-container">
                                <div className="form-header">
                                  <h2>Apply for {iJobs?.jobTitle}</h2>
                                  <p>Department: {iJobs?.department}</p>
                                </div>
                                
                                <form onSubmit={handleApplicationSubmit}>
                                  <div className="form-section">
                                    <label className="form-label">Applicant ID</label>
                                    <input
                                      type="text"
                                      required
                                      className="form-input"
                                      value={applicationData.applicantId}
                                      onChange={(e) => setApplicationData({...applicationData, applicantId: e.target.value})}
                                      placeholder="Enter your applicant ID"
                                    />
                                  </div>

                                  <div className="form-section">
                                    <label className="form-label">Why are you interested in this position?</label>
                                    <textarea
                                      required
                                      className="form-textarea"
                                      value={applicationData.question1}
                                      onChange={(e) => setApplicationData({...applicationData, question1: e.target.value})}
                                      placeholder="Share your interest in this position..."
                                    />
                                  </div>

                                  <div className="form-section">
                                    <label className="form-label">Describe your relevant experience</label>
                                    <textarea
                                      required
                                      className="form-textarea"
                                      value={applicationData.question2}
                                      onChange={(e) => setApplicationData({...applicationData, question2: e.target.value})}
                                      placeholder="Tell us about your relevant experience..."
                                    />
                                  </div>

                                  <div className="form-section">
                                    <label className="form-label">What unique skills do you bring?</label>
                                    <textarea
                                      required
                                      className="form-textarea"
                                      value={applicationData.question3}
                                      onChange={(e) => setApplicationData({...applicationData, question3: e.target.value})}
                                      placeholder="Describe your unique skills..."
                                    />
                                  </div>

                                  <div className="form-section">
                                    <label className="form-label">Upload Resume/Cover Letter</label>
                                    <input
                                      type="file"
                                      required
                                      accept=".pdf,.doc,.docx"
                                      className="form-file-input"
                                      onChange={(e) => setApplicationData({...applicationData, resume: e.target.files?.[0] || null})}
                                    />
                                    <span className="file-helper-text">
                                      <strong>Accepted formats:</strong> PDF, DOC, DOCX
                                    </span>
                                  </div>

                                  <div className="form-section">
                                    <label className="form-label optional">Upload Job Application Form</label>
                                    <input
                                      type="file"
                                      accept=".pdf,.doc,.docx"
                                      className="form-file-input"
                                      onChange={(e) => setApplicationData({...applicationData, jobApplication: e.target.files?.[0] || null})}
                                    />
                                    <span className="file-helper-text">
                                      <strong>Accepted formats:</strong> PDF, DOC, DOCX<br/>
                                      Optional - Include if you have a completed job application form
                                    </span>
                                  </div>

                                  <div className="form-actions">
                                    <button type="submit" className="btn-submit">
                                      Submit Application
                                    </button>
                                    <button type="button" onClick={() => setCurrentPage('jobs')} className="btn-cancel">
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          )}
                      </div> 
                  </div>
              </div>
          </div>
      </div>
    </>
  )
}

export default App
