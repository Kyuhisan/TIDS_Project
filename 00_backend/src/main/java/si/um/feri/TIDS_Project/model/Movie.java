package si.um.feri.TIDS_Project.model;

import com.google.gson.annotations.SerializedName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Movie {
    private String title;
    private String director;

    @SerializedName("releaseDate")
    private String releaseDate;

    private String runtime;

    @SerializedName("leadActors")
    private List<String> leadActors;

    private List<String> genre;
    private String description;
}
