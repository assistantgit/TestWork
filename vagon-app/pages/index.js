import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
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
  Spinner,
  Flex,
} from '@chakra-ui/react';

async function fetchWagons() {
  const response = await axios.get('/api/wagons');
  return response.data;
}

async function uploadPhoto({ vagonNumber, file }) {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('vagonNumber', vagonNumber);
  const response = await axios.post('/api/upload', formData);
  return response.data;
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('VagonNumber');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['wagons'],
    queryFn: fetchWagons,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (_, variables) => {
      toast({
        title: 'Фото завантажено',
        description: `Фото для вагона ${variables.vagonNumber} успішно збережено`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries(['wagons']);
    },
    onError: () => {
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити фото',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    },
  });

  if (isError) return <Text color="red.500">Помилка при отриманні даних</Text>;

  const { wagons, existingPhotos } = data || { wagons: [], existingPhotos: {} };

  const filteredWagons = wagons
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

      {isLoading ? (
        <Flex justify="center" align="center" minH="calc(100vh - 200px)">
          <Spinner size="xl" />
        </Flex>
      ) : filteredWagons.length === 0 ? (
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
                        <Text fontSize="sm" color="green.600">
                          Фото є
                        </Text>
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
                    {uploadMutation.isPending &&
                      uploadMutation.variables?.vagonNumber === wagon.VagonNumber && (
                        <Text fontSize="sm" color="blue.500">
                          Завантаження...
                        </Text>
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