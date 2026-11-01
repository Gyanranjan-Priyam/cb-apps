import { useState, useEffect } from "react";

interface RegistrationData {
  fullName: string;
  email: string;
  mobileNumber: string;
  whatsappNumber: string;
  aadhaarNumber: string;
  state: string;
  district: string;
  collegeName: string;
  collegeAddress: string;
}

interface RegistrationDataResponse extends RegistrationData {
  _metadata?: {
    hasProfileData: boolean;
    hasParticipationData: boolean;
    lastParticipationDate: string | null;
  };
}

export function useRegistrationData() {
  const [data, setData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<RegistrationDataResponse['_metadata'] | null>(null);

  const fetchRegistrationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/registration-data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch registration data');
      }
      
      const result: RegistrationDataResponse = await response.json();
      
      // Extract metadata and main data
      const { _metadata, ...registrationData } = result;
      setMetadata(_metadata || null);
      setData(registrationData);
    } catch (err) {
      console.error('Failed to fetch registration data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Set empty data as fallback
      setData({
        fullName: "",
        email: "",
        mobileNumber: "",
        whatsappNumber: "",
        aadhaarNumber: "",
        state: "",
        district: "",
        collegeName: "",
        collegeAddress: "",
      });
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrationData();
  }, []);

  return { data, loading, error, metadata, refetch: fetchRegistrationData };
}