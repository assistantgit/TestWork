import { useQuery } from '@tanstack/react-query';
import { Box, Container, Heading, Image, Text, SimpleGrid, AspectRatio, Spinner, Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

async function fetchImages() {
  const res = await fetch('/api/photos');
  if (!res.ok) throw new Error('Помилка при завантаженні фото');
  return res.json();
}

export default function PhotosPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['photos'],
    queryFn: fetchImages,
  });

  return (
    <Container maxW="container.xl" py={6}>
      <Heading mb={4}>Фото вагонів</Heading>

      {isError && <Text color="red.500">Помилка при завантаженні фото</Text>}

      {isLoading ? (
        <Flex justify="center" align="center" minH="calc(100vh - 200px)">
          <Spinner size="xl" />
        </Flex>
      ) : data?.images?.length === 0 ? (
        <Text>Жодного фото не знайдено</Text>
      ) : (
        <SimpleGrid columns={[1, 2, 3, 4]} spacing={4}>
          {data?.images.map((img) => {
            const vagonNumber = img.split('.')[0];
            return (
              <Box key={img} borderWidth="1px" borderRadius="lg" overflow="hidden" p={2} bg="gray.50">
                <AspectRatio ratio={4 / 3}>
                  <Image
                    src={`/uploads/${img}`}
                    alt={`Вагон ${vagonNumber}`}
                    objectFit="contain"
                    borderRadius="md"
                    bg="white"
                  />
                </AspectRatio>
                <Text mt={2} fontWeight="medium" textAlign="center">
                  {vagonNumber}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Container>
  );
}