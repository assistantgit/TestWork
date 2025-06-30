// pages/index.js
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Container,
  Text,
  useToast,
  Image,
} from '@chakra-ui/react';
import fs from 'fs';
import path from 'path';

export async function getServerSideProps() {
  try {
    const response = await axios.get('https://rwl.artport.pro/commercialAgent/hs/CarrWorkApp/VagonInfo');
    const wagons = Array.isArray(response.data?.Vagons) ? response.data.Vagons : [];

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const existingPhotos = fs.existsSync(uploadDir)
      ? fs.readdirSync(uploadDir).reduce((acc, file) => {
          const vagon = file.split('.')[0];
          acc[vagon] = `/uploads/${file}`;
          return acc;
        }, {})
      : {};

    return { props: { wagons, existingPhotos } };
  } catch (error) {
    console.error('Fetch error:', error);
    return { props: { wagons: [], existingPhotos: {} } };
  }
}

async function uploadPhoto({ vagonNumber, file }) {
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('vagonNumber', vagonNumber);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Помилка при завантаженні');
  }

  return response;
}

export default function Home({ wagons, existingPhotos = {} }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('VagonNumber');
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (data, variables) => {
      toast({
        title: 'Фото завантажено',
        description: `Фото для вагона ${variables.vagonNumber} успішно збережено`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Invalidate cache and trigger page reload
      queryClient.invalidateQueries();
      router.reload();
    },
    onError: (error, variables) => {
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити фото',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Upload failed:', error);
    },
  });

  // Always work with array
  const safeWagons = Array.isArray(wagons) ? wagons : [];

  const filteredWagons = safeWagons
    .filter((wagon) => wagon.VagonNumber.toString().includes(search))
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) return -1;
      if (a[sortField] > b[sortField]) return 1;
      return 0;
    });

  const handleUpload = (vagonNumber, file) => {
    uploadMutation.mutate({ vagonNumber, file });
  };

  return (
    <Container maxW="container.xl" py={4}>
      <Heading mb={4}>Список вагонів</Heading>
      <Box mb={4}>
        <Input
          placeholder="Пошук за номером вагона"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          mb={2}
        />
        <Select value={sortField} onChange={(e) => setSortField(e.target.value)}>
          <option value="VagonNumber">Номер вагона</option>
          <option value="DepartureStationName">Станція відправлення</option>
          <option value="VagonType">Тип вагона</option>
          <option value="OwnerName">Власник</option>
        </Select>
      </Box>
      
      {filteredWagons.length === 0 ? (
        <Text>Вагони не знайдено</Text>
      ) : (
        <Table variant="striped" colorScheme="gray">
          <Thead bg="blue.500">
            <Tr>
              <Th color="white">Номер</Th>
              <Th color="white">Тип</Th>
              <Th color="white">Вантаж</Th>
              <Th color="white">Власник</Th>
              <Th color="white">Станція відправлення</Th>
              <Th color="white">Фото</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredWagons.map((wagon) => {
              const photoPath = existingPhotos[wagon.VagonNumber];
              const hasPhoto = !!photoPath;

              return (
                <Tr key={wagon.VagonNumber}>
                  <Td fontWeight="bold">{wagon.VagonNumber}</Td>
                  <Td>{wagon.VagonType}</Td>
                  <Td>{wagon.CargoName}</Td>
                  <Td>{wagon.OwnerName}</Td>
                  <Td>{wagon.DepartureStationName}</Td>
                  <Td>
                    {hasPhoto ? (
                      <Box>
                        <Text fontSize="sm" color="green.600">Фото є</Text>
                        <Image
                          src={photoPath}
                          alt={`Фото вагона ${wagon.VagonNumber}`}
                          boxSize="50px"
                          objectFit="cover"
                          mt={1}
                          borderRadius="md"
                        />
                      </Box>
                    ) : (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(wagon.VagonNumber, e.target.files[0])}
                        size="sm"
                        p={1}
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        disabled={uploadMutation.isPending}
                      />
                    )}
                    {uploadMutation.isPending && uploadMutation.variables.vagonNumber === wagon.VagonNumber && (
                      <Text fontSize="sm" color="blue.500">Завантаження...</Text>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </Container>
  );
}