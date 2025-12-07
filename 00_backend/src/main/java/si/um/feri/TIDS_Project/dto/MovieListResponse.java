package si.um.feri.TIDS_Project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import si.um.feri.TIDS_Project.model.Movie;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovieListResponse {
    private List<Movie> movies;
}
