import { NextApiRequest, NextApiResponse } from 'next';
import { getCookie } from 'cookies-next';
import { supabseAuthClient } from '@/lib/supabase/auth';
import appConfig from '@/config/app-config';

const { tableName } = appConfig.supabase

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    const { docUrl } = req.body;
    try {
      const userId = getCookie('user_id', { req, res });
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid credentials' });
      }

      let finalDocs: string[] = [];
      const { data: checkExistingUserDocs } = await supabseAuthClient.supabase
        .from(tableName)
        .select()
        .eq('user_id', userId)
        .select('documents');

      if (checkExistingUserDocs && checkExistingUserDocs.length > 0) {
        const existingDocUrls = checkExistingUserDocs[0].documents.flatMap((doc: any) => {
          return doc
        });
        finalDocs = existingDocUrls.filter((existingDocUrl: string) => existingDocUrl !== docUrl)
      }
      const { data, error } = await supabseAuthClient.supabase
        .from(tableName)
        .upsert(
          {
            user_id: userId,
            documents: finalDocs,
          },
          {
            ignoreDuplicates: false,
            onConflict: 'user_id',
          },
        )
        .select();

      if (error) {
        return res.status(422).json({ success: false, message: error.message });
      }

      return res.status(200).json({ data, message: 'Documents Linked Successfully' });
    } catch (e) {
      console.error("error in linking docs", e)
      res.status(401).json({ success: false, message: 'Something went wrong while linking document to user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
