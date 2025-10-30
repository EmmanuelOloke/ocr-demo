import { useEffect, useRef, useState } from 'react';
import './App.css';
import { Box, FileUpload, Icon, Image, VStack, Progress, Button, Text } from '@chakra-ui/react';
import { InfoCircle, Upload01 } from '@untitledui/icons';
import Tesseract, { createWorker } from 'tesseract.js';

function App() {
  const [imageData, setImageData] = useState<string | null>(null);

  const loadFile = (file: File) => {
    // Convert uploaded image into base64 string and store in imageData state
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataURI = reader.result;
      setImageData(imageDataURI as string);
    };
    reader.readAsDataURL(file);
  };

  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState<string>('idle');
  const [ocrResult, setOcrResult] = useState<string>('');

  const workerRef = useRef<Tesseract.Worker | null>(null);

  useEffect(() => {
    // const initializeWorker = async () => {
    //   workerRef.current = await createWorker('eng', 1, {
    //     logger: (message) => {
    //       if ('progress' in message) {
    //         setProgress(message.progress);
    //         setProgressLabel(message.progress === 1 ? 'Done' : message.status || 'Processing...');
    //       }
    //     },
    //   });
    // };

    // if (workerRef.current) {
    // initializeWorker();
    // }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const handleImageProcessing = async () => {
    setProgress(0);
    setProgressLabel('Starting...');

    // Initialize worker if it doesn't exist
    if (!workerRef.current) {
      workerRef.current = await createWorker('eng', 1, {
        logger: (message) => {
          if ('progress' in message) {
            setProgress(message.progress);
            setProgressLabel(message.progress === 1 ? 'Done' : message.status || 'Processing...');
          }
        },
      });
    }

    const worker = workerRef.current!;
    const response = await worker.recognize(imageData!);
    setOcrResult(response.data.text);
    console.log('OCR Result:', response.data);
  };

  return (
    <>
      <VStack gap={5} border={1} borderColor="red" padding={5} borderRadius="md">
        <FileUpload.Root
          maxW="sm"
          alignItems="stretch"
          maxFiles={1}
          accept={['image/png', 'image/jpg', 'image/jpeg']}
          onFileChange={(details) => {
            if (details.acceptedFiles.length > 0) {
              loadFile(details.acceptedFiles[0]);
            }
          }}
        >
          <FileUpload.HiddenInput />
          <FileUpload.Dropzone>
            <Icon size="md" color="fg.muted">
              <Upload01 />
            </Icon>
            <FileUpload.DropzoneContent>
              <Box>Drag and drop files here</Box>
              <Box color="fg.muted">.png, .jpg up to 5MB</Box>
            </FileUpload.DropzoneContent>
          </FileUpload.Dropzone>
          <FileUpload.List />
        </FileUpload.Root>

        <Box>
          {imageData ? (
            <Image src={imageData} style={{ maxWidth: '400px', maxHeight: '400px' }} />
          ) : (
            <Box>No image uploaded</Box>
          )}
        </Box>

        <Box>
          <Button disabled={!imageData} onClick={handleImageProcessing}>
            Process Image
          </Button>

          <Progress.Root value={progress * 100} min={0} max={100} mt="4" w="64">
            <Progress.Label mb="2">
              {progress === 0 ? 'Idle' : progressLabel} <InfoCircle />
            </Progress.Label>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
            <Progress.ValueText>{progress * 100}%</Progress.ValueText>
          </Progress.Root>
        </Box>

        {!!ocrResult && (
          <Box>
            <Text>RESULT</Text>
            <Text style={{ fontFamily: 'monospace', padding: '10px' }}>{ocrResult}</Text>
          </Box>
        )}
      </VStack>
    </>
  );
}

export default App;
