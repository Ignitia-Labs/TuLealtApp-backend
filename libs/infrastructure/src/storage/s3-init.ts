import { S3Client, CreateBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

/**
 * Script de inicialización para crear el bucket en MinIO/S3
 * Este script puede ejecutarse manualmente o al iniciar la aplicación
 */
export async function initializeS3Bucket(): Promise<void> {
  const bucketName = process.env.S3_BUCKET_NAME || 'tulealtapp-images';
  const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';

  const s3Client = new S3Client({
    endpoint,
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || true,
  });

  try {
    // Intentar crear el bucket
    const createCommand = new CreateBucketCommand({
      Bucket: bucketName,
    });

    await s3Client.send(createCommand);
    console.log(`✅ Bucket '${bucketName}' created successfully`);

    // Configurar política para acceso público (opcional, solo para desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };

      const policyCommand = new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy),
      });

      try {
        await s3Client.send(policyCommand);
        console.log(`✅ Public read policy applied to bucket '${bucketName}'`);
      } catch (error) {
        console.warn(`⚠️  Could not apply public policy: ${error.message}`);
        console.warn('You may need to configure bucket policy manually in MinIO Console');
      }
    }
  } catch (error: any) {
    if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
      console.log(`ℹ️  Bucket '${bucketName}' already exists`);
    } else {
      console.error(`❌ Error creating bucket: ${error.message}`);
      throw error;
    }
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  initializeS3Bucket()
    .then(() => {
      console.log('S3 initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('S3 initialization failed:', error);
      process.exit(1);
    });
}
