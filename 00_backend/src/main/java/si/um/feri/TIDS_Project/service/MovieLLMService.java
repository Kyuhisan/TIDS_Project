package si.um.feri.TIDS_Project.service;

import com.google.common.collect.ImmutableList;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.*;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import si.um.feri.TIDS_Project.dto.MovieListResponse;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
public class MovieLLMService {
    private static final String MOVIE_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "movies": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "title": {"type": "string"},
                  "director": {"type": "string"},
                  "releaseDate": {"type": "string"},
                  "runtime": {"type": "string"},
                  "leadActors": {"type": "array", "items": {"type": "string"}},
                  "genre": {"type": "array", "items": {"type": "string"}},
                  "description": {"type": "string"}
                },
                "propertyOrdering": ["title", "director", "releaseDate", "runtime", "leadActors", "genre", "description"]
              }
            }
          },
          "required": ["movies"],
          "propertyOrdering": ["movies"]
        }
        """;

    private static final String SEARCH_SYSTEM_INSTRUCTION_TEMPLATE = """
        Find EXACTLY %d movies. Make sure the release date is for new upcoming movies only and not reruns.
        Include all the following data, that must be valid and never empty. Every movie must always have all data
        (title, director, releaseDate, runtime, leadActors, genre and description) without exception.
        Also don't append sources to the data itself (example: Date of release: 19.12.2025[1]). I don't want the [] at the end.
        - title
        - director
        - date of release (day.month.year format)
        - runtime (xx hours xx minutes)
        - actors (as array)
        - description

        If any of the data is missing find it or don't include the movie in the list.
        Return EXACTLY %d movies, no more, no less.

        Always output the movies in form of md table.
        """;

    private static final String STRUCTURE_SYSTEM_INSTRUCTION =
        "Parse the provided movie data into a structured JSON format. Extract all movie information including " +
        "title, director, release date, runtime, lead actors, genres, and description. Ensure all fields are properly filled.";

    private final Client client;
    private final String model;
    private final Gson gson = new Gson();
    private final LocalDate currentDate = LocalDate.now();

    public MovieLLMService(@Value("${gemini.api.key}") String apiKey, @Value("${gemini.model}") String model) {
        this.client = Client.builder().apiKey(apiKey).build();
        this.model = model;
    }

    public String searchMovies(int amount, String genre, int range) {
        LocalDate endDate = currentDate.plusMonths(range);
        String prompt = "Find exactly " + amount + " upcoming " + genre + " movie release dates between current date (" + currentDate + ") and " + endDate + ". Return exactly " + amount + " movies.";
        String systemInstruction = String.format(SEARCH_SYSTEM_INSTRUCTION_TEMPLATE, amount, amount);
        Tool googleSearch = Tool.builder().googleSearch(GoogleSearch.builder().build()).build();

        GenerateContentConfig config = GenerateContentConfig.builder()
            .tools(List.of(googleSearch))
            .thinkingConfig(ThinkingConfig.builder().thinkingBudget(-1).build())
            .systemInstruction(Content.fromParts(Part.fromText(systemInstruction)))
            .build();
        return executeQuery(prompt, config);
    }

    public MovieListResponse structureData(String unstructuredData) {
        GenerateContentConfig config = GenerateContentConfig.builder()
            .thinkingConfig(ThinkingConfig.builder().thinkingBudget(-1).build())
            .systemInstruction(Content.fromParts(Part.fromText(STRUCTURE_SYSTEM_INSTRUCTION)))
            .responseMimeType("application/json")
            .responseSchema(Schema.fromJson(MOVIE_SCHEMA))
            .build();
        String jsonResponse = executeQuery(unstructuredData, config);

        if (jsonResponse.isEmpty()) {
            throw new RuntimeException("Empty response from Gemini");
        }

        try {
            return gson.fromJson(jsonResponse, MovieListResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini JSON response: " + e.getMessage(), e);
        }
    }

    private String executeQuery(String userPrompt, GenerateContentConfig config) {
        List<Content> contents = ImmutableList.of(
            Content.builder().role("user").parts(ImmutableList.of(Part.fromText(userPrompt))).build()
        );
        ResponseStream<GenerateContentResponse> responseStream = client.models.generateContentStream(model, contents, config);

        String result = processResponseStream(responseStream);
        responseStream.close();
        return result;
    }

    private String processResponseStream(ResponseStream<GenerateContentResponse> stream) {
        StringBuilder response = new StringBuilder();

        for (GenerateContentResponse res : stream) {
            if (res.candidates().isEmpty() ||
                res.candidates().get().get(0).content().isEmpty() ||
                res.candidates().get().get(0).content().get().parts().isEmpty()) {
                continue;
            }

            List<Part> parts = res.candidates().get().get(0).content().get().parts().get();
            for (Part part : parts) {
                part.text().ifPresent(response::append);
            }
        }
        return response.toString().trim();
    }
}
