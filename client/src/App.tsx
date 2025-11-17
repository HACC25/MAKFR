import React, { useState, useEffect, useCallback  } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

interface JobPosting {
  id: string;
  department: string;
  dutiesSummary: string;
  jobTitle: string;
  // The 'minimumQualifications' property is an object (or 'map') 
  // containing nested qualification details.
  minimumQualifications: {
    education: string;
    experienceDetails: string;
    generalExperienceYears: number;
    licenseOrCertificationRequired: boolean;
    specializedExperienceYears: number;
  };
}

function App() {
  const [count, setCount] = useState(0);
  const [jobs, setJobs] = useState<JobPosting[]>([]); 
  const [iJobs, setIJobs] = useState<JobPosting>(); 
  const [jobId, setJobId] = useState<String>('');
  const [loadingId, setLoadingId] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
    await getJobsById(jobIds).then((data) => {
      if (data) {
        setIJobs(data);
        setLoadingId(true);
        console.log("Fetched job by ID:", iJobs);
      }
    }).catch((err) => {
      console.error("Error fetching job by ID:", err);
    }).finally(() => {
      setLoadingId(false);
    });
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
                  <button className="nav-button" id="nav-selected"> Apply </button>
                  <button className="nav-button"> Review </button>
              </div>

              <div id="inner-wrap"> 
            
                  <div id="page"> 
                      
                      <div id="pageHeader"> </div>
                    
                      <div id="pageContent">
                          <div id="newPage"> 
                              <div className="pageNavBar"> 
                                  <div className="pageNavSearch"> Search </div>
                                  <div className="pageNavList">
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : error ? (
                                        <p>Error: {String(error)}</p>
                                    ) : (
                                      
                                      Array.isArray(jobs) && loadingId! ? (
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
                                    ) : (
                                      
                                      Array.isArray(jobs) && loadingId! ? (
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
                                                        <p> N/A </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Location </h4>
                                                        <p> Oahu </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Job Type </h4>
                                                        <p> Various </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Job Number </h4>
                                                        <p> 01-0000 </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Department </h4>
                                                        <p> DHRD </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Opening Date </h4>
                                                        <p> XX/XX/XX </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Closing Date </h4>
                                                        <p> Continuous </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div id="jobViewOptions"> 
                                              <button className="jobViewOptionItem" id="jobViewOptionItemSelected"> Description </button>
                                              <button className="jobViewOptionItem"> Benefits </button>
                                              <button className="jobViewOptionItem"> Questions </button>
                                            </div>
                                            <div id="jobView">
                                              <p><strong>Duties:</strong> {job.dutiesSummary}</p>
                                              <p><strong>Education:</strong> {job.minimumQualifications.education}</p>
                                              <p><strong>Experience Details:</strong> {job.minimumQualifications.experienceDetails}</p>
                                              <div>
                                                <strong>General Experience Years:</strong> {job.minimumQualifications.generalExperienceYears}
                                              </div>
                                            </div>                                            
                                          </div>
                                        ))
                                      ) : loadingId ? (
                                        <div key={iJobs?.jobTitle}> 
                                          
                                            <div id="jobHeader">
                                                <div id="jobHeaderArea"> 
                                                    <div id="jobHeaderInfo"> 
                                                        <h1 id="jobHeaderName"> {iJobs?.jobTitle} </h1>
                                                        <p id="jobHeaderSub"> {iJobs?.department} </p>
                                                    </div>
                                                    <div id="jobHeaderActions"> 
                                                        <button id="applyButton"> Apply </button>
                                                    </div>
                                                </div>
                                                <div id="jobHeaderMisc"> 
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Salary </h4>
                                                        <p> N/A </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Location </h4>
                                                        <p> Oahu </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Job Type </h4>
                                                        <p> Various </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Job Number </h4>
                                                        <p> 01-0000 </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Department </h4>
                                                        <p> DHRD </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Opening Date </h4>
                                                        <p> XX/XX/XX </p>
                                                    </div>
                                                    <div className="jobHeaderMiscItem"> 
                                                        <h4> Closing Date </h4>
                                                        <p> Continuous </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div id="jobViewOptions"> 
                                              <button className="jobViewOptionItem" id="jobViewOptionItemSelected"> Description </button>
                                              <button className="jobViewOptionItem"> Benefits </button>
                                              <button className="jobViewOptionItem"> Questions </button>
                                            </div>
                                            <div id="jobView">
                                              <p><strong>Duties:</strong> {iJobs?.dutiesSummary}</p>
                                              <p><strong>Education:</strong> {iJobs?.minimumQualifications.education}</p>
                                              <p><strong>Experience Details:</strong> {iJobs?.minimumQualifications.experienceDetails}</p>
                                              <div>
                                                <strong>General Experience Years:</strong> {iJobs?.minimumQualifications.generalExperienceYears}
                                              </div>
                                            </div>                                            
                                          </div>
                                      ) : (
                                        // This displays if data is not an array or is an empty array
                                        <p>No job postings found.</p>
                                      )
                                    )}
                                      
                                      
                                  </div>
                              </div>
                          </div>
                      </div> 
                  </div>
              </div>
          </div>
      </div>
    </>
  )
}

export default App
