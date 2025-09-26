import { useState } from 'react';
import { toast } from 'sonner';

const useFetch = (cb) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);

    const fn = async(...arg) => {
        setLoading(true);
        setError(null);

        try{
            const response = await cb(...arg);
            setData(response);
            setError(null);
            return response;
        } catch(error){
            setError(error);
            toast.error(error.message || "Something went wrong");
            return null;
        } finally{
            setLoading(false);
        }
    };

    return {data, loading, error, fn, setData};
}

export default useFetch;