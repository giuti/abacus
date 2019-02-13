import React from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, FlatList } from 'react-native';
import { createStackNavigator, createAppContainer } from 'react-navigation';

class HomeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Matches"
          onPress={() => this.props.navigation.navigate('Matches')}
        />
      </View>
    );
  }
}

class MatchesScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: [],
      matches: [],
      gaps: [],
      isMatchesLoading: true,
      isStandingsLoading: true,
      isGapsLoading: true
    }
  }

  async getStandings() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/teams/');
      const responseJson = await response.json();
      var teams = [];
      for (var i = 0; i < responseJson.data.length; i++) {
        teams.push({
          id: responseJson.data[i].id,
          position: responseJson.data[i].position,
          teamId: responseJson.data[i].teamId,
          name: responseJson.data[i].name,
          crest: responseJson.data[i].crest,
          played: responseJson.data[i].played,
          won: responseJson.data[i].won,
          draw: responseJson.data[i].draw,
          lost: responseJson.data[i].lost,
          points: responseJson.data[i].points,
          goalsFor: responseJson.data[i].goalsFor,
          goalsAgainst: responseJson.data[i].goalsAgainst,
          goalsDiff: responseJson.data[i].goalsDiff,
          teamsDiff: {}
        });
      }
      this.setState({
        isStandingsLoading: false,
        standingsData: responseJson,
        teams: teams,
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  async getMatches() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/matches/');
      const responseJson = await response.json();
      var matches = [];
      for (var i = 0; i < responseJson.data.length; i++) {
        if (responseJson.data[i].status != 'FINISHED'){
          matches.push({
            awayTeamGoals: responseJson.data[i].awayTeamGoals,
            awayTeamId: responseJson.data[i].awayTeamId,
            awayTeamName: responseJson.data[i].awayTeamName,
            homeTeamGoals: responseJson.data[i].homeTeamGoals,
            homeTeamId: responseJson.data[i].homeTeamId,
            homeTeamName: responseJson.data[i].homeTeamName,
            id: responseJson.data[i].id,
            matchId: responseJson.data[i].matchId,
            matchday: responseJson.data[i].matchday,
            status: responseJson.data[i].status,
            utcDate: responseJson.data[i].utcDate
          });
        }
      }
      this.setState({
        isMatchesLoading: false,
        matchesData: responseJson,
        matches: matches
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  async getGaps() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/gaps/');
      const responseJson = await response.json();
      var gaps = {};
      for (var i = 0; i < responseJson.data.length; i++) {
        gaps[responseJson.data[i].teamId+'_'+responseJson.data[i].awayTeamId] = responseJson.data[i].diff
      }
      this.setState({
        isGapsLoading: false,
        gapsData: responseJson,
        gaps: gaps
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  componentDidMount(){
    this.getStandings();
    this.getMatches();
    this.getGaps();
  }

  render() {
    if(this.state.isMatchesLoading || this.state.isStandingsLoading){
      return(
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator/>
        </View>
      )
    }

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FlatList
          data={this.state.matches.sort((a, b) => (a.matchday - b.matchday))}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                {item.homeTeamName}{item.homeTeamGoals}{item.awayTeamGoals}{item.awayTeamName}
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'match_'+item.id}
        />
        <Button
          title="Calculate"
          onPress={() => this.props.navigation.navigate('CalculatedTable', {teams: this.state.teams, gaps: this.state.gaps})}
        />
      </View>
    );
  }
}

class CalculatedTableScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: this.props.navigation.getParam('teams', []),
      gaps: this.props.navigation.getParam('gaps', []),
      orderedTeams: []
    }
  }

  sortTable() {
    var sortedTeams = []
    var groupBy = function(xs, key) {
      return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };

    var teams = this.state.teams
    var gaps = this.state.gaps
    var groupedTeams = groupBy(teams, 'points')

    for (var key in groupedTeams) {
      var groupTeamsList = groupedTeams[key]
      var groupedTeamsLength = groupTeamsList.length
      console.log(groupTeamsList);
      if (groupedTeamsLength < 2) {
        sortedTeams.unshift(groupTeamsList[0]);
      } else if (groupedTeamsLength == 2) {
        var teamA = groupTeamsList[0];
        var teamB = groupTeamsList[1];
        var diff = (gaps[teamA.id+'_'+teamB.id] || 0) - (gaps[teamB.id+'_'+teamA.id] || 0);
        if (diff < 0) {
          sortedTeams.unshift(teamA);
          sortedTeams.unshift(teamB);
        } else if (diff > 0) {
          sortedTeams.unshift(teamB);
          sortedTeams.unshift(teamA);
        } else {
          var globalDiff = teamA.goalsDiff - teamB.goalsDiff
          if (globalDiff < 0) {
            sortedTeams.unshift(teamA);
            sortedTeams.unshift(teamB);
          } else if (globalDiff > 0) {
            sortedTeams.unshift(teamB);
            sortedTeams.unshift(teamA);
          } else {
            var globalFor = teamA.goalsFor - teamB.goalsFor
            if (globalFor < 0) {
              sortedTeams.unshift(teamA);
              sortedTeams.unshift(teamB);
            } else if (globalFor > 0) {
              sortedTeams.unshift(teamB);
              sortedTeams.unshift(teamA);
            } else {
              // Default sorting
              sortedTeams.unshift(teamA);
              sortedTeams.unshift(teamB);
            }
          }
        }
      } else if (groupedTeamsLength > 2) {
        var mapTeams = {}
        for (var v=0; v<groupedTeamsLength; v++) {
          mapTeams[groupTeamsList[v].id] = {'pts': 0, 'diff': 0};
        }
        for (var i=0; i<groupedTeamsLength; i++) {
          for (var j=0; j<groupedTeamsLength; j++) {
            if (i != j) {
              var gap = gaps[groupTeamsList[i].id+'_'+groupTeamsList[j].id] || 0;
              mapTeams[groupTeamsList[i].id].diff += gap;
              mapTeams[groupTeamsList[j].id].diff -= gap;
              if ( gap< 0) {
                mapTeams[groupTeamsList[j].id].pts += 3;
              } else if (gap > 0) {
                mapTeams[groupTeamsList[i].id].pts += 3;
              } else if (gap == 0){
                mapTeams[groupTeamsList[i].id].pts += 1;
                mapTeams[groupTeamsList[j].id].pts += 1;
              } else {
                console.log(groupTeamsList[i].name+' vs '+groupTeamsList[j].name+' - Not played yet.');
              }
            }
          }
        }
        groupedTeams.sort(function(a, b){
          if (a.group.pts == b.group.pts) {
            if (a.group.diff == b.group.diff) {
              if (a.goalsDiff == b.goalsDiff) {
                b.goalsFor - a.goalsFor
              } else {
                b.goalsDiff - a.goalsDiff
              }
            } else {
              return b.group.diff - a.group.diff
            }
          } else {
            return b.group.pts - a.group.pts;
          }
        });
        for (var v=0; v<groupedTeamsLength; v++) {
          sortedTeams.unshift(groupedTeams[v]);
        }
      }
    }

    this.setState({
      sortedTeams: sortedTeams
    }, function(){

    });
  }

  componentDidMount(){
    this.sortTable();
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Calculated Table Screen</Text>
        <FlatList
          data={this.state.sortedTeams}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                | {item.name} | {item.points} | {item.goalsFor} |
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'team_'+item.id}
        />
      </View>
    );
  }
}

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Matches: MatchesScreen,
    CalculatedTable: CalculatedTableScreen,
  },
  {
    initialRouteName: 'Home',
  }
);

export default createAppContainer(RootStack);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
